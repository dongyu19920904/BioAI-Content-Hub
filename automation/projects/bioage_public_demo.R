# Reproduce the upstream public-data example; never write participant-level records.
expected_commit <- "b1f9fc02f086cd4aa74185f2335ab1366082e7fe"
stopifnot(identical(Sys.getenv("BIOAGE_UPSTREAM_COMMIT"), expected_commit))

library(BioAge)
data("NHANES3", package = "BioAge")
data("NHANES4", package = "BioAge")

biomarkers <- c(
  "albumin_gL", "lymph", "mcv", "glucose_mmol", "rdw",
  "creat_umol", "lncrp", "alp", "wbc"
)
result <- phenoage_nhanes(biomarkers = biomarkers)
values <- result$data$phenoage
valid <- values[is.finite(values)]
stopifnot(length(valid) > 0L, length(values) == nrow(NHANES4))

summary <- list(
  upstream_repository = "dayoonkwon/BioAge",
  upstream_commit = expected_commit,
  sample_source = "bundled public NHANES III and NHANES IV",
  nhanes3_rows = nrow(NHANES3),
  nhanes4_rows = nrow(NHANES4),
  biomarker_count = length(biomarkers),
  valid_model_outputs = length(valid),
  median_model_output = unname(stats::median(valid))
)
dir.create("automation/runs/bioage-public-demo", recursive = TRUE, showWarnings = FALSE)
jsonlite::write_json(
  summary,
  "automation/runs/bioage-public-demo/summary.json",
  auto_unbox = TRUE,
  pretty = TRUE
)
