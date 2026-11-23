import { defineRailway, project, service, volume } from "railway/iac";
// This repository manages only its own resources in the environment. Other
// repositories export their own partial name.
// See https://docs.railway.com/infrastructure-as-code#multi-repo-projects
export const partial = "trackflow-api";
export default defineRailway(() => {
  const dataVolume = volume("trackflow-api-volume", {
    sizeMB: 500,
    region: "iad",
  });
  const trackflowApi = service("trackflow-api", {
    build: { builder: "DOCKERFILE", dockerfilePath: "Dockerfile", buildEnvironment: "V3" },
    start: "sh -c 'exec uvicorn services.api.main:app --host 0.0.0.0 --port ${PORT}'",
    healthcheck: "/health",
    healthcheckTimeout: 300,
    preDeploy: "mkdir -p /data",
    replicas: { "iad": 1 },
    volumeMounts: { "/data": dataVolume },
  });

  return project("trackflow-api", {
    variables: { managed: false },
    resources: [trackflowApi, dataVolume],
  });
});
