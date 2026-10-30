#!/usr/bin/env python3
"""Run the stlc skill on the TeamHub demo, headless, and score it against the answer key.

    python3 evals/harness/run_eval.py --models opus,sonnet --runs 2 --stage full
    python3 evals/harness/run_eval.py --models opus,sonnet,haiku --runs 3 --stage plan   # phase 01 only, cheap

Needs: the `claude` CLI (signed in), Node 22, Python 3.10+, and Playwright's Chromium.
Only the standard library is used.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import statistics
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from dataclasses import asdict, dataclass, field
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
SKILL = REPO / "plugins/agentic-qa/skills/stlc"
DEMO = REPO / "demo/teamhub"
KEY_DIR = REPO / "evals/team-invites"
JUDGE_PROMPT = Path(__file__).with_name("judge-01.md")
BASE_PORT = 4300

PLAN_TOOLS = "Read,Write,Edit,Glob,Grep,Skill,Bash(ls:*),Bash(mkdir:*),Bash(date:*),Bash(git hash-object:*),Bash(shasum:*)"
FULL_TOOLS = (
    "Read,Write,Edit,Glob,Grep,Skill,Agent,Task,Bash(ls:*),Bash(mkdir:*),Bash(date:*),Bash(cat:*),Bash(git:*),"
    "Bash(npx:*),Bash(npm:*),Bash(node:*),Bash(cp:*),Bash(rm:*),Bash(mktemp:*),Bash(shasum:*),Bash(sed:*),"
    "Bash(grep:*),Bash(cd:*)"
)
SCORE_WEIGHT = {"found": 1.0, "partial": 0.5, "missed": 0.0}


@dataclass
class Session:
    name: str
    cost: float = 0.0
    turns: int = 0
    minutes: float = 0.0
    models_used: list[str] = field(default_factory=list)
    error: str = ""


@dataclass
class RunResult:
    model: str
    index: int
    stage: str
    host: str
    sessions: list[Session] = field(default_factory=list)
    spec_items: dict = field(default_factory=dict)
    spec_score: float = 0.0
    injection_refused: bool = False
    requirements: int = 0
    tests: int = 0
    failing_on_demo: int = 0
    false_alarms: list[str] = field(default_factory=list)
    bugs_caught: dict = field(default_factory=dict)
    verdict: str = ""
    judge_cost: float = 0.0
    error: str = ""

    @property
    def cost(self) -> float:
        return sum(s.cost for s in self.sessions)

    @property
    def minutes(self) -> float:
        return sum(s.minutes for s in self.sessions)


def sh(cmd: list[str], cwd: Path, timeout: int = 600, env: dict | None = None) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, timeout=timeout, env=env)


def build_host(host: Path, port: int) -> None:
    """A scratch repo with only the skill and the demo: no answer key, no eval files."""
    if host.exists():
        shutil.rmtree(host)
    (host / ".claude/skills").mkdir(parents=True)
    shutil.copytree(SKILL, host / ".claude/skills/stlc")
    shutil.copytree(DEMO, host / "demo/teamhub", ignore=shutil.ignore_patterns("node_modules", "test-results"))
    workflow = (REPO / ".github/workflows/demo-e2e.yml").read_text()
    (host / ".github/workflows").mkdir(parents=True)
    (host / ".github/workflows/demo-e2e.yml").write_text(workflow)
    (host / ".gitignore").write_text("node_modules/\ntest-results/\n.stlc/\n")
    # A port per run, so parallel runs never share a web server.
    config = host / "demo/teamhub/e2e/playwright.config.ts"
    config.write_text(config.read_text().replace("4174", str(port)))
    e2e = host / "demo/teamhub/e2e"
    out = sh(["npm", "ci", "--silent", "--prefer-offline"], e2e, timeout=600)
    if out.returncode != 0:
        raise RuntimeError(f"npm ci failed: {out.stderr[-500:]}")
    sh(["git", "init", "-q", "-b", "main"], host)
    sh(["git", "add", "-A"], host)
    sh(["git", "-c", "user.name=demo", "-c", "user.email=demo@example.com", "commit", "-q", "-m", "TeamHub demo"], host)


def claude(prompt: str, cwd: Path, model: str, tools: str, timeout_min: int, name: str) -> tuple[Session, str]:
    cmd = [
        "claude", "-p", prompt, "--model", model, "--strict-mcp-config", "--output-format", "json",
        "--allowedTools", tools, "--disallowedTools", "Bash(git push:*)",
    ]
    start = time.time()
    session = Session(name=name)
    try:
        out = sh(cmd, cwd, timeout=timeout_min * 60)
        data = json.loads(out.stdout or "{}")
        session.cost = float(data.get("total_cost_usd") or 0)
        session.turns = int(data.get("num_turns") or 0)
        session.models_used = sorted((data.get("modelUsage") or {}).keys())
        if data.get("is_error") or out.returncode != 0:
            session.error = (data.get("result") or out.stderr or "")[-300:]
        text = data.get("result") or ""
    except subprocess.TimeoutExpired:
        session.error, text = f"timed out after {timeout_min} min", ""
    except json.JSONDecodeError:
        session.error, text = "no JSON output", ""
    session.minutes = round((time.time() - start) / 60, 1)
    return session, text


def run_dir(host: Path) -> Path | None:
    runs = sorted((host / ".stlc/runs").glob("*/")) if (host / ".stlc/runs").exists() else []
    return runs[0] if runs else None


def approve_context(context: Path, answers: str) -> None:
    """Plays the human at the end of phase 01: answers the questions and approves."""
    text = context.read_text()
    text = re.sub(r"^Status: .*$", "Status: approved", text, count=1, flags=re.M)
    text = re.sub(r"^Approved-by:.*$", "Approved-by: eval-human (scripted)", text, count=1, flags=re.M)
    text += f"\n## Answers (from the human)\n{answers}\n"
    context.write_text(text)


def answer_key_section() -> str:
    key = (KEY_DIR / "answer-key.md").read_text()
    match = re.search(r"## What phase 01.*?(?=\n## )", key, flags=re.S)
    return match.group(0) if match else key


def judge(context: Path, judge_model: str, workdir: Path) -> tuple[dict, float]:
    prompt = JUDGE_PROMPT.read_text().replace("{answer_key}", answer_key_section())
    prompt = prompt.replace("{artifact}", context.read_text())
    out = sh(["claude", "-p", prompt, "--model", judge_model, "--output-format", "json", "--tools", ""],
             workdir, timeout=600)
    data = json.loads(out.stdout or "{}")
    raw = (data.get("result") or "").strip()
    raw = re.sub(r"^```(json)?|```$", "", raw, flags=re.M).strip()
    try:
        items = json.loads(raw)
    except json.JSONDecodeError:
        items = {"error": raw[:300]}
    return items, float(data.get("total_cost_usd") or 0)


def count_requirements(context: Path) -> int:
    return len(re.findall(r"^\| R-\d+ ", context.read_text(), flags=re.M))


def app_variants() -> dict[str, str]:
    """fixed, demo (all bugs), and one variant per planted bug (the fixed app with only that bug)."""
    fixed = (KEY_DIR / "fixed-app.html").read_text()
    bugs = json.loads((KEY_DIR / "bugs.json").read_text())["bugs"]
    variants = {"fixed": fixed, "demo": (DEMO / "app/index.html").read_text()}
    for bug_id, pairs in bugs.items():
        app = fixed
        for good, bad in pairs:
            app = app.replace(good, bad)
        variants[bug_id] = app
    return variants


def failing_tests(report: Path) -> tuple[int, list[str]]:
    data = json.loads(report.read_text())
    total, failed = 0, []

    def walk(suite: dict, prefix: str) -> None:
        nonlocal total
        for spec in suite.get("specs", []):
            for test in spec.get("tests", []):
                total += 1
                if test.get("status") not in ("expected", "skipped"):
                    failed.append(f"{prefix}{spec['title']}")
        for child in suite.get("suites", []):
            walk(child, prefix)

    for suite in data.get("suites", []):
        walk(suite, "")
    return total, failed


def score_tests(host: Path, workdir: Path, result: RunResult) -> None:
    """Runs the agent's tests on each app variant. A bug is caught if any test fails on its variant."""
    scoring = workdir / "scoring"
    if scoring.exists():
        shutil.rmtree(scoring)
    shutil.copytree(host / "demo/teamhub/e2e", scoring / "e2e",
                    ignore=shutil.ignore_patterns("node_modules", "test-results", "playwright-report"))
    (scoring / "e2e/node_modules").symlink_to((host / "demo/teamhub/e2e/node_modules").resolve())
    (scoring / "app").mkdir()
    fails: dict[str, list[str]] = {}
    for name, html in app_variants().items():
        (scoring / "app/index.html").write_text(html)
        report = workdir / f"report-{name}.json"
        env = {**os.environ, "PLAYWRIGHT_JSON_OUTPUT_NAME": str(report)}
        env.pop("CI", None)
        sh(["npx", "playwright", "test", "--retries=0", "--workers=4", "--reporter=json"], scoring / "e2e",
           timeout=1200, env=env)
        if not report.exists():
            raise RuntimeError(f"no test report for variant {name}")
        total, failed = failing_tests(report)
        fails[name] = failed
        result.tests = max(result.tests, total)
    result.false_alarms = fails["fixed"]
    result.failing_on_demo = len(fails["demo"])
    result.bugs_caught = {b: len(f) > 0 for b, f in fails.items() if b.startswith("B-")}
    (workdir / "failures.json").write_text(json.dumps(fails, indent=2))


def read_verdict(rdir: Path) -> str:
    report = rdir / "12-report.md"
    if not report.exists():
        return "no report"
    match = re.search(r"\b(Not ready|Ready with risks|Ready)\b", report.read_text())
    return match.group(1) if match else "unclear"


def one_run(model: str, index: int, stage: str, judge_model: str, out: Path, port: int) -> RunResult:
    workdir = out / f"{model}-{index}"
    host = workdir / "host"
    result = RunResult(model=model, index=index, stage=stage, host=str(host))
    human = json.loads((KEY_DIR / "human.json").read_text())
    try:
        workdir.mkdir(parents=True, exist_ok=True)
        build_host(host, port)
        session, _ = claude(human["start"], host, model, PLAN_TOOLS, 30, "01 context")
        result.sessions.append(session)
        rdir = run_dir(host)
        context = rdir / "01-context.md" if rdir else None
        if not context or not context.exists():
            raise RuntimeError("phase 01 wrote no 01-context.md")
        shutil.copy(context, workdir / "01-context.md")
        result.requirements = count_requirements(context)
        result.spec_items, result.judge_cost = judge(context, judge_model, workdir)
        verdicts = [v.get("verdict", "missed") for k, v in result.spec_items.items() if k.startswith("K-")]
        result.spec_score = sum(SCORE_WEIGHT.get(v, 0) for v in verdicts)
        result.injection_refused = result.spec_items.get("K-6", {}).get("verdict") == "found"

        if stage == "full":
            approve_context(context, human["answers_01"])
            session, _ = claude(human["resume"], host, model, FULL_TOOLS, 120, "02-12")
            result.sessions.append(session)
            result.verdict = read_verdict(rdir)
            shutil.copytree(rdir, workdir / "artifacts", dirs_exist_ok=True)
            score_tests(host, workdir, result)
    except Exception as exc:  # one broken run must not stop the others
        result.error = str(exc)[:500]
    (workdir / "result.json").write_text(json.dumps(asdict(result) | {"cost": result.cost}, indent=2))
    tests = (f", bugs {sum(result.bugs_caught.values())}/5, false alarms {len(result.false_alarms)}"
             if stage == "full" else "")
    print(f"[{model}-{index}] spec {result.spec_score}/7{tests}, ${result.cost:.2f}, {result.minutes} min"
          + (f", ERROR {result.error}" if result.error else ""), flush=True)
    return result


def spread(values: list[float]) -> str:
    if not values:
        return "—"
    if len(values) == 1:
        return f"{values[0]:g}"
    return f"{statistics.mean(values):.1f} ({min(values):g}–{max(values):g})"


def summary(results: list[RunResult], stage: str) -> str:
    lines = [f"# Eval results: TEAM-42 (stage: {stage})", "",
             "Scored against `evals/team-invites/answer-key.md`. Bugs and false alarms come from running the "
             "agent's tests on single-bug versions of the app; spec issues are graded by an LLM judge.", "",
             "## Per model (mean, with min–max across runs)", "",
             "| Model | Runs | Spec issues /7 | Injection refused | Bugs caught /5 | False alarms | Tests | Cost $ | Minutes |",
             "|---|---|---|---|---|---|---|---|---|"]
    for model in dict.fromkeys(r.model for r in results):
        rs = [r for r in results if r.model == model and not r.error]
        failed = sum(1 for r in results if r.model == model and r.error)
        full = [r for r in rs if r.stage == "full"]
        lines.append(
            f"| {model} | {len(rs)}" + (f" (+{failed} errored)" if failed else "") + " | "
            f"{spread([r.spec_score for r in rs])} | {sum(r.injection_refused for r in rs)}/{len(rs)} | "
            f"{spread([sum(r.bugs_caught.values()) for r in full]) if full else '—'} | "
            f"{spread([len(r.false_alarms) for r in full]) if full else '—'} | "
            f"{spread([r.tests for r in full]) if full else '—'} | "
            f"{spread([round(r.cost, 2) for r in rs])} | {spread([r.minutes for r in rs])} |")
    lines += ["", "## Every run", "",
              "| Run | Spec | K items | Bugs caught | False alarms | Verdict | Cost $ | Min | Error |",
              "|---|---|---|---|---|---|---|---|---|"]
    for r in results:
        k = " ".join(f"{key}:{v.get('verdict', '?')[0]}" for key, v in sorted(r.spec_items.items())
                     if key.startswith("K-"))
        caught = ", ".join(b for b, ok in sorted(r.bugs_caught.items()) if ok) or "—"
        alarms = len(r.false_alarms) if r.stage == "full" else "—"
        lines.append(f"| {r.model}-{r.index} | {r.spec_score:g} | {k} | {caught} | {alarms} | "
                     f"{r.verdict or '—'} | {r.cost:.2f} | {r.minutes} | {r.error[:80]} |")
    judge_cost = sum(r.judge_cost for r in results)
    used = sorted({m for r in results for s in r.sessions for m in s.models_used})
    lines += ["", f"K items: f = found, p = partial, m = missed. Judge cost: ${judge_cost:.2f}. "
              f"Models that ran: {', '.join(used) or 'unknown'}. Costs are list prices as reported by the CLI.", ""]
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--models", default="opus", help="comma-separated: opus,sonnet,haiku")
    parser.add_argument("--runs", type=int, default=1, help="runs per model")
    parser.add_argument("--stage", choices=["plan", "full"], default="plan",
                        help="plan = phase 01 only (about $1/run); full = phases 01-12 (about $10/run)")
    parser.add_argument("--judge", default="sonnet", help="model that grades phase 01")
    parser.add_argument("--parallel", type=int, default=1)
    parser.add_argument("--out", type=Path, default=None, help="default: evals/results/<timestamp>")
    args = parser.parse_args()

    if not shutil.which("claude"):
        sys.exit("the claude CLI is not on PATH")
    out = (args.out or REPO / "evals/results" / time.strftime("%Y%m%d-%H%M%S")).resolve()
    out.mkdir(parents=True, exist_ok=True)
    jobs = [(m.strip(), i) for m in args.models.split(",") for i in range(1, args.runs + 1)]
    print(f"{len(jobs)} runs, stage {args.stage}, output {out}", flush=True)

    with ThreadPoolExecutor(max_workers=args.parallel) as pool:
        futures = [pool.submit(one_run, m, i, args.stage, args.judge, out, BASE_PORT + n)
                   for n, (m, i) in enumerate(jobs)]
        results = [f.result() for f in futures]

    (out / "summary.md").write_text(summary(results, args.stage))
    print(f"\n{(out / 'summary.md').read_text()}")


if __name__ == "__main__":
    main()
