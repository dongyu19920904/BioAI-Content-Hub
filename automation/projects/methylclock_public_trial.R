# Trial a fixed, bundled public beta matrix. Never export per-sample estimates.
expected_commit <- "30be0284066fda7d2f81ec4bf427da56f0f89d1b"
stopifnot(identical(Sys.getenv("METHYLCLOCK_UPSTREAM_COMMIT"), expected_commit))

library(methylclock)
stopifnot(as.character(packageVersion("methylclock")) == "1.99.2")
data("methylclock_betas", package = "methylclock")
stopifnot(identical(dim(methylclock_betas), c(919L, 16L)))

clock_names <- c("Horvath", "Levine", "Wu")
coverage <- clockCoverage(methylclock_betas, clocks = clock_names)
coverage <- coverage[match(clock_names, coverage$clock),
                     c("clock", "n_cpgs", "present", "pct_present")]
stopifnot(nrow(coverage) == 3L,
          !anyNA(coverage),
          all(coverage$n_cpgs > 0L),
          all(coverage$present == coverage$n_cpgs))

estimate <- methylclock(methylclock_betas, clocks = "Horvath", storage = "memory")
estimate <- as.data.frame(estimate)
stopifnot(nrow(estimate) == 16L, "Horvath" %in% names(estimate))
values <- estimate$Horvath
stopifnot(is.numeric(values))
finite <- values[is.finite(values)]
stopifnot(length(finite) == 16L)

summary <- list(
  upstream_repository = "isglobal-brge/methylclock",
  upstream_commit = expected_commit,
  package_version = as.character(packageVersion("methylclock")),
  r_version = as.character(getRversion()),
  sample_source = "bundled methylclock_betas public research subset",
  input_cpg_rows = nrow(methylclock_betas),
  public_sample_columns = ncol(methylclock_betas),
  coverage = lapply(seq_len(nrow(coverage)), function(i) {
    list(clock = coverage$clock[i], n_cpgs = coverage$n_cpgs[i],
         present = coverage$present[i], pct_present = coverage$pct_present[i])
  }),
  horvath_finite_outputs = length(finite),
  horvath_median_model_output = unname(stats::median(finite))
)
dir.create("automation/runs/methylclock-public-trial", recursive = TRUE,
           showWarnings = FALSE)
jsonlite::write_json(
  summary,
  "automation/runs/methylclock-public-trial/summary.json",
  auto_unbox = TRUE,
  pretty = TRUE
)
