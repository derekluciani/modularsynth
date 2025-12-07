# Feature Request

## Requirements
* Write code that displays a background image per theme.

### Theme: Minimal
* None

### Theme: Stranger Things
* Apply the following assets and specs:
  * display [asset](../../app/src/assets/stranger-wide@2x.webp) as a background-image if:
    * the users screen density is 2x.
    * `@media (width ≥ 2050px)`
  * display [asset](../../app/src/assets/stranger-narrow@2x.webp) as a background-image if:
    * the users screen density is 2x.
    * `@media (width ≤ 2048px)`
  * display [asset](../../app/src/assets/stranger-wide.webp) as a background-image if:
    * the users screen density is 1x.
    * `@media (width ≥ 1025px)`
  * display [asset](../../app/src/assets/stranger-narrow.webp) as a background-image if:
    * the users screen density is 1x.
    * `@media (width ≤ 1024px)`  
* Apply these props to all assets:
  * position: top, centered, fixed, no-repeat
  * animation: when the theme becomes active, change opacity value from 0 to 1, animation-duration: 2s;

## Acceptance Criteria
- If the "Stranger Things" theme is active, the expected background image is displayed.
- If the "Minimal" theme is active, there is no background image.
- Regression testing: All other existing functionality is unchanged, working as expected.

> ! END OF DOCUMENT
