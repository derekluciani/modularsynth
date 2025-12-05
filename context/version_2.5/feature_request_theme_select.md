# Feature Request 

## Goal  
* Create a mechanism that allows a user to select a specific tailwind theme.

## Requirements
* Create a Select component that allows the user to select a specific tailwind theme. Theme declarations are located in [index.css](../../app/src/index.css)

### UI:
component: `select`

content:
- icon: `paint-bucket`
- label: "Theme:"
- value:`{theme.value}`

theme values: 
* `.stranger-things` (default)
* `.minimal`

component layout: "`icon` Theme: Stranger Things"

component location: Place the component in the `<footer>` element in the `App.tsx` file.

## Acceptance Criteria
- When the app loads, the default theme "Stranger Things" is active.
- If the user selects the Select component, the options "Stanger Things" and "Minimal" are displayed.
- If the user selects the "Minimal" theme, that theme is active and styles are applied globally.

> ! END OF DOCUMENT