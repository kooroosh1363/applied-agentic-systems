# Local demo on Windows / Acer

1. Install Node.js 22 or newer if it is not installed.
2. Download or clone the feature branch containing Project 11 v2.
3. Open `11-enterprise-rag-evaluation-platform` and double-click `Start-Demo.cmd`.
4. Your default browser opens `http://localhost:8110`. Keep the console open.
5. Click **Run evaluation**. Inspect quality gates, slices and case evidence.
6. Change **Candidate scenario** to **Inject a wrong number** and run again.
7. Open **Case explorer**, choose **Changed vs. baseline**, and inspect the altered claim beside its source.
8. Use **Experiments** to run four retrieval ablations, and **Run history** to reopen or select a baseline.
9. Download JSON, CSV or the HTML report. Use **Focus mode** for a less cluttered screen recording.
10. Press Ctrl+C in the console when finished. Reports remain in `data/`.

The browser executes the real backend; no values are hard-coded into the dashboard. Default evidence is synthetic. Do not present it as a customer benchmark or a live language-model test. Local model execution is separately configured and labeled.

This document covers operation only. The LinkedIn scenario, script and post are a later step.
