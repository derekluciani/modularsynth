# Feature Request 

## User Goal  
* Move away from hard-coded ('default patch') values, in favor of a more scalable system that stores/loads patches from individual files (ie. default_patch.json).

## Requirements
* The user can 'create' a new preset by selecting a 'save' button and then naming it.
* A reusable file template is used to 'store' the user's preset name and patch values.
  * The list order of saved presets is to display as "Last In First Out"
* The user can 'load' saved presets by selecting them from a menu.
* The user cannot 'update' an existing preset.
* The user cannot 'delete' an existing preset.
* The user can 'export' or download their current patch to a local file.
* The user can 'import' or upload a patch file into their current app session.
  * The user expects the uploaded patch file to play immediately.
  * If the uploaded patch values are successfully loaded, the user can 'save' as a preset.
  * If the uploaded patch values fail to load, display the error message: "The file failed to load, please try again. If the problem persists, check for issues with the patch data." 
* This feature is required to function on a local and remote web server.
* I would like to avoid implementing a SQL database and instead rely on a local storage solution.   

## Open Questions

> ! END OF DOCUMENT