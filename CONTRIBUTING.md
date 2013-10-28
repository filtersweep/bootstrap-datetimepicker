Contributions guidelines:

- No code will be merged if jslint doesn't like it.
- Use tabs and set them to whatever spacing you like *in your editor.*
- If it is a bug, try to add an automated test that reproduces it in the
  test/issues.coffee, following the conventions already adopted.
- If it is a new feature, try to add automated tests for it.
- Never submit patches that break existing tests(make test should take care of
  downloading dependencies and running the tests)
- Do not commit the files in the 'build' dir, 'git update-index --assume-unchanged build/{js,css}/*' will help

Before starting to develop, enter 'make deps' to download all dependencies
needed for developing/testing. 'make test' will run all tests. 
