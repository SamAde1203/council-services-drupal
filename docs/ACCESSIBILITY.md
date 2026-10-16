# Accessibility report

Target: **WCAG 2.2 level AA**, the standard UK public sector websites must meet under the Public Sector Bodies (Websites and Mobile Applications) Accessibility Regulations 2018.

## Automated testing

[`tests/accessibility/a11y-check.js`](../tests/accessibility/a11y-check.js) runs on every push in CI. It uses Playwright and axe-core 4.10 with the `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa` and `best-practice` rule sets, at desktop (1280px) and mobile (390px) widths.

| Page state | axe-core violations |
|---|---|
| Home page | 0 |
| Bin day form | 0 |
| Results | 0 |
| Validation error | 0 |
| Another page with the sidebar block | 0 |

It also checks that:

- the first Tab stop on every page is "Skip to main content"
- after a search, keyboard focus moves to the results heading

Automated tools catch roughly a third of accessibility problems, so this is a baseline, not a guarantee.

## How the site meets key WCAG criteria

| Criterion | How |
|---|---|
| 1.3.1 Info and relationships | Labelled fields, a logical heading order, and landmark regions (`header`, `nav`, `main`, `aside`, `footer`) |
| 1.4.1 Use of colour | Each bin is named in text ("Blue bin"). The colour swatch is decorative and hidden from screen readers |
| 1.4.3 Contrast (minimum) | Every text and background pair in the theme was measured. The lowest is 6.2:1, against a 4.5:1 requirement (see `civic/css/base.css`) |
| 1.4.10 Reflow | Single-column layout with no horizontal scrolling on small screens. Tested at 390px |
| 2.1.1 Keyboard | Everything works by keyboard. The form needs no JavaScript |
| 2.4.1 Bypass blocks | A skip link is the first focusable element |
| 2.4.3 Focus order | After a search, focus moves to the results heading |
| 2.4.7 / 2.4.11 Focus visible, not obscured | A high-contrast yellow and black focus style on every interactive element |
| 3.3.1 Error identification | An error summary at the top links to the field, the field has an inline error, and `aria-invalid` is set |
| 3.3.2 Labels or instructions | A visible label and a hint ("For example, S1 2HH") placed before the field |
| 3.3.3 Error suggestion | Error messages say how to fix the problem ("Enter a real UK postcode, like S1 2HH") |
| 4.1.2 Name, role, value | Native HTML form controls; `autocomplete="postal-code"` |
| 4.1.3 Status messages | Errors use `role="alert"` and other messages use `role="status"` |

## Issues found and fixed during development

| Issue | Found by | Fix |
|---|---|---|
| Drupal's default message template used `role="contentinfo"`, duplicating the footer landmark | axe-core | The Civic theme overrides `status-messages.html.twig` to use `alert` or `status` |
| The demo banner sat outside any landmark | axe-core | Made it a labelled `<section>` |
| The previous postcode's results stayed visible beside a new error | Functional test | Results are cleared at the start of validation |
| Hint text came after the input, so screen readers read it too late | Review against the GOV.UK Design System | The theme renders the hint and error before the field |
| The main menu showed the current page by styling only | Review | `aria-current` is set in `civic_preprocess_menu__main()` |

## Still to do

- Manual screen reader testing with NVDA and Firefox on Windows, and VoiceOver and Safari on macOS and iOS
- Testing at 200% and 400% browser zoom
- An accessibility statement page, which a real council site would need
