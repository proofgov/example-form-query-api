## Example Form Query API

1. Set up some environmental variables
```bash
export PROOF_URL=https://app.proofgov.com
export PROOF_API_TOKEN=<some-token>
```
2. Run `bin/setup-form` to push a schema.
3. Run `bin/generate-submission` to push a submission.

Both `bin/setup-form` and `bin/generate-submission` support a --help option.

> Note that the `bin/setup-form` creates a `provider_info.yaml` file that is used for subsequent requests.
> 
> Note: To run lots of submissions, just execute `while true; do bin/generate-submission; done`
