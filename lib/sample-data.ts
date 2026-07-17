export type SampleCase = {
  buttonLabel: string
  type: "error" | "config"
  content: string
}

export const sampleCases: SampleCase[] = [
  {
    buttonLabel: "Terraform Provider Error",
    type: "error",
    content: `Error: Missing required provider configuration

Error: Failed to query available provider packages

Could not retrieve the list of available versions for provider hashicorp/aws: provider registry.terraform.io/hashicorp/aws was not required by any configuration.

Add a required_providers block to your Terraform configuration.`,
  },
  {
    buttonLabel: "Django Settings Error",
    type: "error",
    content: `django.core.exceptions.ImproperlyConfigured: The SECRET_KEY setting must not be empty.

DisallowedHost: Invalid HTTP_HOST header: 'api.example.com'. You may need to add 'api.example.com' to ALLOWED_HOSTS.`,
  },
  {
    buttonLabel: "Docker Port Mismatch",
    type: "config",
    content: `# Dockerfile
EXPOSE 3000

# docker-compose.yml
services:
  app:
    ports:
      - "8080:80"`,
  },
  {
    buttonLabel: "Nginx Upstream Error",
    type: "config",
    content: `upstream api_backend {
  server api:3000;
}

server {
  location /api/ {
    proxy_pass http://backend_api;
  }
}`,
  },
]
