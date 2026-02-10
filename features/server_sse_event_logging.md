# SSE Event Logging

We want to show how the workflow looks during operation. After the process has been started through the backend, we need to stream the events coming from the AI SDK to make the workflow transparent 

- Increase transparency of workflow by streaming events to web through SSE
- Understand event flow, need to deduce
  - when stages are done
  - when tools are called
  - what inputs tools are called with
  - what was the reasoning for the response
    - This allows for nano agent fixes in future
  - Does this happen in apps/web or apps/server
- Use aspects from Temporal to ensure complete coverage at all points of workflow run
  - Can anything be borrowed from how Temporal tracks workflows and keeps event state?
- For this feature, need update in UI to basic tracking