# Decision methodology

For criterion value `x` on declared scale `[min,max]`, maximize normalization is `(x-min)/(max-min)` and minimize normalization is `1 - (x-min)/(max-min)`. Values are bounded to the declared scale. Contribution equals normalized value times criterion weight times evidence quality.

Weights must be positive and total exactly one within a small numerical tolerance. This makes ownership explicit: weights are policy, not learned truth. Evidence quality averages declared reliability; unverified evidence receives a fifty-percent discount and cannot satisfy the verified-evidence gate.

Hard constraints are evaluated separately. A cheap option below the minimum SLA is disqualified; a high average cannot compensate for a prohibited failure. Eligible options are ranked deterministically by score and stable option identity.

A recommendation requires at least two eligible options and a top-two gap meeting the declared minimum. Sensitivity analysis increases and decreases each criterion weight while proportionally renormalizing the others. A changed leader signals fragility, not automatic rejection.

This is multi-criteria decision support, not causal inference, optimization under every uncertainty distribution, or proof that organizational preferences were elicited correctly.
