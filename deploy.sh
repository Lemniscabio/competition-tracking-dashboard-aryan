#!/usr/bin/env bash
# Deploy the Competitor Tracker to Google Cloud Run.
#
# Prerequisites (one-time):
#   - gcloud CLI installed and `gcloud auth login` completed
#   - .env.local present with all six env vars (NEXT_PUBLIC_*, SUPABASE_SERVICE_ROLE_KEY,
#     GEMINI_API_KEY, APP_PASSCODE, CRON_SECRET)
#   - Project bootstrapped (APIs, Artifact Registry repo, secrets) — see one-time setup below.
#
# Usage:  ./deploy.sh
set -euo pipefail

PROJECT="lem-market-signals"
REGION="asia-south1"
REPO="app"
IMAGE="web"
SERVICE="comp-tracker"
IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT}/${REPO}/${IMAGE}:latest"

cd "$(dirname "$0")"

# Load env (so NEXT_PUBLIC_* can be baked into the build).
set -a; . ./.env.local; set +a

gcloud config set project "$PROJECT" >/dev/null

echo "==> Building image via Cloud Build"
gcloud builds submit \
  --config cloudbuild.yaml \
  --substitutions=_REGION="${REGION}",_REPO="${REPO}",_IMAGE="${IMAGE}",_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}",_SUPABASE_ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY}"

echo "==> Deploying to Cloud Run"
gcloud run deploy "$SERVICE" \
  --image "$IMAGE_URI" \
  --region "$REGION" \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --timeout 3600 \
  --set-env-vars "NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL},NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  --set-secrets "SUPABASE_SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY:latest,GEMINI_API_KEY=GEMINI_API_KEY:latest,APP_PASSCODE=APP_PASSCODE:latest,CRON_SECRET=CRON_SECRET:latest"

echo "==> Done. Service URL:"
gcloud run services describe "$SERVICE" --region "$REGION" --format='value(status.url)'

# --- One-time setup (run once per project; safe to re-run) -------------------
# gcloud services enable run.googleapis.com cloudbuild.googleapis.com \
#   artifactregistry.googleapis.com secretmanager.googleapis.com cloudscheduler.googleapis.com
# gcloud artifacts repositories create app --repository-format=docker --location=asia-south1
# PN=$(gcloud projects describe lem-market-signals --format='value(projectNumber)')
# SA="${PN}-compute@developer.gserviceaccount.com"
# for R in roles/cloudbuild.builds.builder roles/storage.objectAdmin roles/artifactregistry.writer \
#          roles/logging.logWriter roles/secretmanager.secretAccessor; do
#   gcloud projects add-iam-policy-binding lem-market-signals --member="serviceAccount:${SA}" --role="$R" --condition=None
# done
# for K in SUPABASE_SERVICE_ROLE_KEY GEMINI_API_KEY APP_PASSCODE CRON_SECRET; do
#   printf '%s' "${(P)K}" | gcloud secrets create "$K" --data-file=-   # zsh; bash uses ${!K}
# done
# Cron (Cloud Scheduler):
# gcloud scheduler jobs create http comp-tracker-scan --location asia-south1 \
#   --schedule "30 1,13 * * *" --time-zone "Etc/UTC" \
#   --uri "$(gcloud run services describe comp-tracker --region asia-south1 --format='value(status.url)')/api/cron/scan" \
#   --http-method GET --headers "Authorization=Bearer ${CRON_SECRET}"
