## Error handling

Errors may occur during login, when requesting an ad or during the executable ad playback.

### Login errors

The XAAF SDK will handle all login errors internally. No action is needed by the hosting app.

### Error when requesting an ad

In case an ad is requested before the SDK is initialized, an executable ad will be returned but will be in the STOPPED state, with the hosting app getting a lifecycle notification.

### Executable ad errors

When the executable ad has a failure, the hosting client will be notified by an unrecoverable error event, accompanied by an error object containing additional information pertaining to an error. If such error happens, the ad UI will be removed from the container.

The executable ad object should be released in this case. The hosting client should continue as usual and can request another executable ad for the next ad opportunity.

### Non-fatal error (warning)

When the hosting client does not follow the executable ad life cycle expectations, a warning event will be sent to the hosting client stating an "invalid state transition". After such a warning, the executable ad can continue with its life cycle.