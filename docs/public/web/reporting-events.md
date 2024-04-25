## Executable Ad reporting events

The executable ad reports some life cycle events during its lifetime. To get these notifications the hosting application should provide an observer/listener, implementing corresponding protocol/interface. The hosting client will be notified when:

- ad was initialized and is ready to play (_ad loaded_ event - STATE_LOADED),
- ad has started playing (_ad started_ event – STATE_STARTED)
- ad was stopped (_ad stopped_ event with reason (of type String – STATE_STOPPED))
- an error occurred during the ad life cycle (_ad error_ event – STATE_ERROR)