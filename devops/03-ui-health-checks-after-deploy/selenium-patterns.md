# Selenium patterns (sanitized)

## Page Object skeleton

```python
# start: page object - booking form shell
class BookingFormPage:
    def __init__(self, driver, base_url: str):
        self.driver = driver
        self.base_url = base_url.rstrip("/")

    def open(self):
        self.driver.get(f"{self.base_url}/app/booking")
        return self

    def assert_service_field_visible(self):
        field = self.driver.find_element("css selector", "[data-testid='service']")
        assert field.is_displayed()
        return self
# end: page object - booking form shell
```

## Waits

- Prefer **explicit wait** on `data-testid` or stable roles, not fixed `sleep`.
- Centralize timeout constants (e.g. 15s staging, 30s cold start).

## CI outline (conceptual)

```yaml
# start: ci ui health check stage - conceptual
ui_health_after_deploy:
  stage: test
  image: python:3.12-slim
  script:
  - pip install selenium webdriver-manager pytest
  - pytest tests/ui_health --base-url "$STAGING_BASE_URL" --headless
  rules:
  - if: $CI_PIPELINE_SOURCE == "push"
# end: ci ui health check stage - conceptual
```

Use **staging base URL** from CI variables - never commit prod hosts.

## Selectors

- `data-testid` owned by app team.
- Avoid brittle XPath on visible text that changes with i18n.