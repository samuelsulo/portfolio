# Makefile: Terraform workflow for infrastructure/
#
# Usage:
#   make <target> [ENV=sandbox|production] [...]

# ── DEFAULTS ──────────────────────────────────────────────────────────────────

ENV         ?= sandbox
LIVE_DIR    ?= live
ENV_DIR     ?= environments/$(ENV)
TF          ?= terraform
VAR_FILE    ?= ../$(ENV_DIR)/environment.tfvars
BACKEND_CFG ?= ../$(ENV_DIR)/backend.hcl
PROJECT_TFVARS ?= $(LIVE_DIR)/project.auto.tfvars

# ── COLORS ────────────────────────────────────────────────────────────────────

RESET  := \033[0m
BOLD   := \033[1m
GREEN  := \033[32m
YELLOW := \033[33m
RED    := \033[31m
CYAN   := \033[36m

# ── HELPERS ───────────────────────────────────────────────────────────────────

define log
	@echo "$(BOLD)$(CYAN)[infrastructure | $(ENV)]$(RESET) $(1)"
endef

define log_ok
	@echo "$(BOLD)$(GREEN)✓$(RESET) $(1)"
endef

define log_warn
	@echo "$(BOLD)$(YELLOW)⚠$(RESET) $(1)"
endef

# ── SCAFFOLDING ───────────────────────────────────────────────────────────────

## scaffold-env: Scaffold a new environment from ACCOUNT_ID + live/project.auto.tfvars (usage: make scaffold-env ENV=<name> ACCOUNT_ID=<12-digit-id>)
scaffold-env:
	@if [ "$(ENV)" != "sandbox" ] && [ "$(ENV)" != "production" ]; then \
		echo "$(RED)✗ ENV must be either 'sandbox' or 'production'.$(RESET)"; \
		exit 1; \
	fi
	@if [ -z "$(ACCOUNT_ID)" ]; then \
		echo "$(RED)✗ Missing ACCOUNT_ID parameter.$(RESET)"; \
		echo "  Usage: make scaffold-env ENV=<sandbox|production> ACCOUNT_ID=<12-digit-account-id>"; \
		exit 1; \
	fi
	@if ! echo "$(ACCOUNT_ID)" | grep -qE '^[0-9]{12}$$'; then \
		echo "$(RED)✗ ACCOUNT_ID must be a 12-digit AWS account ID.$(RESET)"; \
		exit 1; \
	fi
	@if [ ! -f "$(PROJECT_TFVARS)" ]; then \
		echo "$(RED)✗ $(PROJECT_TFVARS) not found: it must define 'project' and 'aws_region'.$(RESET)"; \
		exit 1; \
	fi
	$(call log, Scaffolding environment: $(BOLD)$(ENV)$(RESET))
	@mkdir -p $(ENV_DIR)
	@PROJECT=$$(grep -E '^project[[:space:]]*=' $(PROJECT_TFVARS) | sed -E 's/^project[[:space:]]*=[[:space:]]*"([^"]*)".*/\1/'); \
	AWS_REGION=$$(grep -E '^aws_region[[:space:]]*=' $(PROJECT_TFVARS) | sed -E 's/^aws_region[[:space:]]*=[[:space:]]*"([^"]*)".*/\1/'); \
	if [ -z "$$PROJECT" ] || [ -z "$$AWS_REGION" ]; then \
		echo "$(RED)✗ Could not read 'project' and 'aws_region' from $(PROJECT_TFVARS).$(RESET)"; \
		exit 1; \
	fi; \
	printf 'environment    = "%s"\naws_account_id = "%s"\naws_role_arn   = "arn:aws:iam::%s:role/SamuelSuloAdminRole"\n' "$(ENV)" "$(ACCOUNT_ID)" "$(ACCOUNT_ID)" > $(ENV_DIR)/environment.tfvars; \
	printf 'bucket = "terraform-state-%s-%s-an"\nkey = "%s/terraform.tfstate"\nregion = "%s"\nuse_lockfile = true\nencrypt = true\n' "$(ACCOUNT_ID)" "$$AWS_REGION" "$$PROJECT" "$$AWS_REGION" > $(ENV_DIR)/backend.hcl; \
	echo "  $(GREEN)✓$(RESET) $(ENV_DIR)/environment.tfvars written (environment=$(ENV), aws_account_id=$(ACCOUNT_ID))"; \
	echo "  $(GREEN)✓$(RESET) $(ENV_DIR)/backend.hcl written (project=$$PROJECT, aws_region=$$AWS_REGION)"
	$(call log_ok, Scaffold created: $(ENV_DIR)/)

SCAFFOLD_LIVE_FILES := main.tf variables.tf outputs.tf README.md

## scaffold-live: Scaffold the live directory with Terraform files (won't overwrite existing files)
scaffold-live:
	$(call log, Scaffolding live directory: $(BOLD)$(LIVE_DIR)/$(RESET))
	@mkdir -p $(LIVE_DIR)
	@for f in $(SCAFFOLD_LIVE_FILES); do \
		if [ -f "$(LIVE_DIR)/$$f" ]; then \
			echo "  $(YELLOW)⤳ $(LIVE_DIR)/$$f already exists, skipping$(RESET)"; \
		else \
			touch "$(LIVE_DIR)/$$f"; \
			echo "  $(GREEN)✓$(RESET) $(LIVE_DIR)/$$f created"; \
		fi; \
	done
	$(call log_ok, Live scaffold complete: $(LIVE_DIR)/)

SCAFFOLD_MODULE_FILES := main.tf variables.tf outputs.tf versions.tf README.md

## scaffold-module: Scaffold a new Terraform module (usage: make scaffold-module MODULE=<name>)
scaffold-module:
	@if [ -z "$(MODULE)" ]; then \
		echo "$(RED)✗ Missing MODULE parameter.$(RESET)"; \
		echo "  Usage: make scaffold-module MODULE=<module-name>"; \
		exit 1; \
	fi
	$(call log, Scaffolding module: $(BOLD)modules/$(MODULE)$(RESET))
	@mkdir -p modules/$(MODULE)
	@for f in $(SCAFFOLD_MODULE_FILES); do \
		if [ -f "modules/$(MODULE)/$$f" ]; then \
			echo "  $(YELLOW)⤳ modules/$(MODULE)/$$f already exists, skipping$(RESET)"; \
		else \
			touch "modules/$(MODULE)/$$f"; \
			echo "  $(GREEN)✓$(RESET) modules/$(MODULE)/$$f created"; \
		fi; \
	done
	$(call log_ok, Module scaffold complete: modules/$(MODULE)/)

# ── TERRAFORM WORKFLOW ────────────────────────────────────────────────────────

## init: Initialize Terraform and configure the backend
init:
	$(call log, Initializing Terraform for environment: $(BOLD)$(ENV)$(RESET))
	@cd $(LIVE_DIR) && $(TF) init \
		-backend-config="$(BACKEND_CFG)" \
		-reconfigure
	$(call log_ok, Init complete)

## validate: Validate Terraform configuration
validate: init
	$(call log, Validating configuration...)
	@cd $(LIVE_DIR) && $(TF) validate
	$(call log_ok, Configuration is valid)

## fmt: Format all Terraform files (.tf/.tfvars) and generic HCL files (e.g. backend.hcl)
fmt:
	$(call log, Formatting Terraform files...)
	@$(TF) fmt -recursive .
	@for f in $$(find . -name '*.hcl' -not -name '*.tftest.hcl' -not -path '*/.terraform/*'); do \
		tmp="$$f.tmp"; \
		$(TF) fmt - < "$$f" > "$$tmp" && mv "$$tmp" "$$f" || { rm -f "$$tmp"; exit 1; }; \
	done
	$(call log_ok, Formatting complete)

## fmt-check: Check Terraform and HCL formatting without modifying files (useful in CI)
fmt-check:
	$(call log, Checking formatting...)
	@$(TF) fmt -recursive -check .
	@for f in $$(find . -name '*.hcl' -not -name '*.tftest.hcl' -not -path '*/.terraform/*'); do \
		if ! $(TF) fmt - < "$$f" | diff -q - "$$f" >/dev/null; then \
			echo "$(RED)✗ $$f is not formatted (run 'make fmt')$(RESET)"; \
			exit 1; \
		fi; \
	done
	$(call log_ok, All files are correctly formatted)

## plan: Generate and save the execution plan
plan: validate
	$(call log, Generating plan for environment: $(BOLD)$(ENV)$(RESET))
	@cd $(LIVE_DIR) && $(TF) plan \
		-var-file="$(VAR_FILE)" \
		-out="../$(ENV_DIR)/tfplan"
	$(call log_ok, Plan saved to $(ENV_DIR)/tfplan)

## show-plan: Show the saved execution plan
show-plan:
	$(call log, Showing saved plan for environment: $(BOLD)$(ENV)$(RESET))
	@if [ ! -f "$(ENV_DIR)/tfplan" ]; then \
		echo "$(RED)✗ No saved plan found. Run 'make plan' first.$(RESET)"; \
		exit 1; \
	fi
	@cd $(LIVE_DIR) && $(TF) show "../$(ENV_DIR)/tfplan"

## apply: Apply the saved plan
apply:
	$(call log_warn, Applying plan for environment: $(BOLD)$(ENV)$(RESET))
	@if [ ! -f "$(ENV_DIR)/tfplan" ]; then \
		echo "$(RED)✗ No saved plan found. Run 'make plan' first.$(RESET)"; \
		exit 1; \
	fi
	@cd $(LIVE_DIR) && $(TF) apply "../$(ENV_DIR)/tfplan"
	$(call log_ok, Apply complete)
	@rm -f $(ENV_DIR)/tfplan

## apply-target: Plan and apply a specific resource target (usage: make apply-target TARGET=<resource>)
apply-target: validate
	$(call log_warn, Applying target $(BOLD)$(TARGET)$(RESET) for environment: $(BOLD)$(ENV)$(RESET))
	@if [ -z "$(TARGET)" ]; then \
		echo "$(RED)✗ Missing required parameter.$(RESET)"; \
		echo "  Usage: make apply-target TARGET=<resource_address>"; \
		exit 1; \
	fi
	@cd $(LIVE_DIR) && $(TF) apply \
		-var-file="$(VAR_FILE)" \
		-target="$(TARGET)" \
		-auto-approve
	$(call log_ok, Target apply complete)

## apply-auto: Plan and apply in one step (use with caution)
apply-auto: validate
	$(call log_warn, Running plan + apply for environment: $(BOLD)$(ENV)$(RESET))
	@cd $(LIVE_DIR) && $(TF) apply \
		-var-file="$(VAR_FILE)" \
		-auto-approve
	$(call log_ok, Apply complete)

## plan-destroy: Preview what a destroy would remove, without applying anything
plan-destroy: validate
	$(call log, Generating destroy plan for environment: $(BOLD)$(ENV)$(RESET))
	@cd $(LIVE_DIR) && $(TF) plan \
		-destroy \
		-var-file="$(VAR_FILE)"

## refresh: Reconcile state with real infrastructure without changing it (plan -refresh-only)
refresh: validate
	$(call log, Refreshing state for environment: $(BOLD)$(ENV)$(RESET))
	@cd $(LIVE_DIR) && $(TF) plan \
		-refresh-only \
		-var-file="$(VAR_FILE)"

## destroy: Destroy all resources in the target environment
destroy:
	$(call log_warn, $(RED)Destroying all resources for environment: $(BOLD)$(ENV)$(RESET))
	@read -p "Are you sure? Type 'yes' to confirm: " confirm && \
		[ "$$confirm" = "yes" ] || (echo "Aborted." && exit 1)
	@cd $(LIVE_DIR) && $(TF) destroy \
		-var-file="$(VAR_FILE)"
	$(call log_ok, Destroy complete)

## destroy-target: Destroy a specific resource target (usage: make destroy-target TARGET=<resource>)
destroy-target:
	$(call log_warn, $(RED)Destroying target $(BOLD)$(TARGET)$(RESET) $(RED)for environment: $(BOLD)$(ENV)$(RESET))
	@if [ -z "$(TARGET)" ]; then \
		echo "$(RED)✗ Missing required parameter.$(RESET)"; \
		echo "  Usage: make destroy-target TARGET=<resource_address>"; \
		exit 1; \
	fi
	@read -p "Destroy $(TARGET)? Type 'yes' to confirm: " confirm && \
		[ "$$confirm" = "yes" ] || (echo "Aborted." && exit 1)
	@cd $(LIVE_DIR) && $(TF) destroy \
		-var-file="$(VAR_FILE)" \
		-target="$(TARGET)"
	$(call log_ok, Target destroy complete)

# ── STATE MANAGEMENT ─────────────────────────────────────────────────────────

## import: Import an existing resource into Terraform state (usage: make import ADDR=<address> ID=<id>)
import:
	$(call log, Importing resource into Terraform state for environment: $(BOLD)$(ENV)$(RESET))
	@if [ -z "$(ADDR)" ] || [ -z "$(ID)" ]; then \
		echo "$(RED)✗ Missing required parameters.$(RESET)"; \
		echo "  Usage: make import ADDR=<resource_address> ID=<resource_id>"; \
		exit 1; \
	fi
	@cd $(LIVE_DIR) && $(TF) import \
		-var-file="$(VAR_FILE)" \
		$(ADDR) $(ID)
	$(call log_ok, Resource $(ADDR) imported successfully)

## state-rm: Remove a resource from state without destroying it (usage: make state-rm ADDR=<address>)
state-rm:
	$(call log_warn, Removing resource from Terraform state for environment: $(BOLD)$(ENV)$(RESET))
	@if [ -z "$(ADDR)" ]; then \
		echo "$(RED)✗ Missing required parameter.$(RESET)"; \
		echo "  Usage: make state-rm ADDR=<resource_address>"; \
		exit 1; \
	fi
	@read -p "Remove $(ADDR) from state? Type 'yes' to confirm: " confirm && \
		[ "$$confirm" = "yes" ] || (echo "Aborted." && exit 1)
	@cd $(LIVE_DIR) && $(TF) state rm $(ADDR)
	$(call log_ok, Resource $(ADDR) removed from state)

## state-list: List all resources in the Terraform state
state-list:
	$(call log, Listing resources in state for environment: $(BOLD)$(ENV)$(RESET))
	@cd $(LIVE_DIR) && $(TF) state list

## state-show: Show details of a specific resource in state (usage: make state-show ADDR=<address>)
state-show:
	$(call log, Showing resource details for environment: $(BOLD)$(ENV)$(RESET))
	@if [ -z "$(ADDR)" ]; then \
		echo "$(RED)✗ Missing required parameter.$(RESET)"; \
		echo "  Usage: make state-show ADDR=<resource_address>"; \
		exit 1; \
	fi
	@cd $(LIVE_DIR) && $(TF) state show $(ADDR)

## unlock: Force-release a stuck state lock (usage: make unlock LOCK_ID=<id>)
unlock:
	$(call log_warn, Force-unlocking state for environment: $(BOLD)$(ENV)$(RESET))
	@if [ -z "$(LOCK_ID)" ]; then \
		echo "$(RED)✗ Missing required parameter.$(RESET)"; \
		echo "  Usage: make unlock LOCK_ID=<lock_id>"; \
		echo "  (the lock ID is printed by Terraform when a command fails to acquire the lock)"; \
		exit 1; \
	fi
	@read -p "Force-unlock $(LOCK_ID)? Only do this if you are sure no other apply is running. Type 'yes' to confirm: " confirm && \
		[ "$$confirm" = "yes" ] || (echo "Aborted." && exit 1)
	@cd $(LIVE_DIR) && $(TF) force-unlock $(LOCK_ID)
	$(call log_ok, Lock released)

## taint: Mark a resource for recreation on the next apply (usage: make taint ADDR=<address>)
taint:
	$(call log_warn, Tainting resource for environment: $(BOLD)$(ENV)$(RESET))
	@if [ -z "$(ADDR)" ]; then \
		echo "$(RED)✗ Missing required parameter.$(RESET)"; \
		echo "  Usage: make taint ADDR=<resource_address>"; \
		exit 1; \
	fi
	@cd $(LIVE_DIR) && $(TF) taint $(ADDR)
	$(call log_ok, Resource $(ADDR) marked for recreation)

## untaint: Undo a previous taint (usage: make untaint ADDR=<address>)
untaint:
	$(call log, Untainting resource for environment: $(BOLD)$(ENV)$(RESET))
	@if [ -z "$(ADDR)" ]; then \
		echo "$(RED)✗ Missing required parameter.$(RESET)"; \
		echo "  Usage: make untaint ADDR=<resource_address>"; \
		exit 1; \
	fi
	@cd $(LIVE_DIR) && $(TF) untaint $(ADDR)
	$(call log_ok, Resource $(ADDR) untainted)

# ── INSPECTION ───────────────────────────────────────────────────────────────

## console: Open an interactive console to evaluate expressions against the current state
console:
	@cd $(LIVE_DIR) && $(TF) console -var-file="$(VAR_FILE)"

## providers: Show the provider requirements and versions in use
providers:
	@cd $(LIVE_DIR) && $(TF) providers

## version: Show the Terraform and provider versions
version:
	@$(TF) version

## upgrade: Re-initialize and upgrade provider/module versions to the latest allowed
upgrade:
	$(call log, Upgrading providers and modules for environment: $(BOLD)$(ENV)$(RESET))
	@cd $(LIVE_DIR) && $(TF) init \
		-backend-config="$(BACKEND_CFG)" \
		-upgrade
	$(call log_ok, Upgrade complete)

# ── DOCS ─────────────────────────────────────────────────────────────────────

## docs: Regenerate each module's README input/output tables with terraform-docs
docs:
	@command -v terraform-docs >/dev/null 2>&1 || { \
		echo "$(RED)✗ terraform-docs not found.$(RESET) Install it: https://terraform-docs.io/user-guide/installation/"; \
		exit 1; \
	}
	@for d in modules/*/; do \
		echo "$(CYAN)→ $$d$(RESET)"; \
		terraform-docs markdown table --output-file README.md --output-mode inject "$$d"; \
	done
	$(call log_ok, Module documentation regenerated)

# ── OUTPUT ───────────────────────────────────────────────────────────────────

## output: Show outputs for the target environment
output:
	$(call log, Outputs for environment: $(BOLD)$(ENV)$(RESET))
	@cd $(LIVE_DIR) && $(TF) output

## output-json: Show outputs in JSON format
output-json:
	@cd $(LIVE_DIR) && $(TF) output -json

# ── CLEANUP ──────────────────────────────────────────────────────────────────

## clean: Remove local Terraform cache and saved plans
clean:
	$(call log, Cleaning local Terraform cache...)
	@rm -rf $(LIVE_DIR)/.terraform
	@rm -rf $(LIVE_DIR)/.terraform.lock.hcl
	@rm -f $(ENV_DIR)/tfplan
	$(call log_ok, Clean complete)

# ── HELP ─────────────────────────────────────────────────────────────────────

## help: Show this help message
help:
	@echo ""
	@echo "$(BOLD)Infrastructure: Terraform Makefile$(RESET)"
	@echo "$(CYAN)Usage:$(RESET) make [target] [ENV=environment]"
	@echo ""
	@echo "$(CYAN)Default environment:$(RESET) sandbox"
	@echo ""
	@echo "$(CYAN)Targets:$(RESET)"
	@grep -hE '^## ' $(MAKEFILE_LIST) | sed 's/## /  /' | column -t -s ':'
	@echo ""

.DEFAULT_GOAL := help