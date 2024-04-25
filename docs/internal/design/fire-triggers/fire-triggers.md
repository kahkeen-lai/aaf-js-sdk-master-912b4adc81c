## Fire Triggers

### Motivation

XAAF JS SDK should support fire triggers as was implemented by native platforms.
Each command contained in XiP response may include a list of triggers to fire upon any of the following:

1. Pre-execution of the command
2. Post-execution of the command
3. Command's operation completion (for example, when a SHOW_VIDEO command's video playback completes)

Once a trigger is fired as a result of any of the above, it behaves like any other trigger (state trigger) - will trigger the execution of any command which has it as its execution trigger. 

### Example of fire triggers element in XiP response command
```JSON
{
  "id": 1,
  "commandName": "SHOW_VIDEO",
  "data": {
    "url": "http://itvads.dtvcdn.com/itv_csads/A060485536F0.mp4",
    "transparent": false,
    "videoRepeatCount": 1,
    "autoPlay": "false",
    "muted": true,
    "zOrder": "background",
    "preload": true
  },
  "fireTriggers": [
    {
      "mode": "COMPLETED",
      "name": "UNSQUEEZE"
    }
  ],
  "executionTriggers": [
    {
      "trigger": "STATE_STARTING"
    }
  ]
}
```

### Execution Flow

```plantuml
@startuml
participant BE
participant FSM
BE->ExecutableAd: Opportunity XiP response
ExecutableAd->ExecutableAd: Create Triggers to Commands mapping
ExecutableAd->CommandsDataStructuresCreator: Create Command IDs to Fire Triggers mapping
CommandsDataStructuresCreator->ExecutableAd: Command IDs to Fire Triggers mapping
FSM->ExecutableAd: State Trigger
group Handle Trigger - Loop on all Commands for Trigger
ExecutableAd->ExecutableAd: Get Command
group Loop on all PRE Fire Triggers for Command ID
ExecutableAd->ExecutableAd: Get PRE Trigger
ExecutableAd->ExecutableAd: Fire PRE Trigger
note left of ExecutableAd: Back to Handle Trigger
end
ExecutableAd->Command: Execute
group Loop on all POST Fire Triggers for Command ID
ExecutableAd->ExecutableAd: Get POST Trigger 
ExecutableAd->ExecutableAd: Fire POST Trigger
note left of ExecutableAd: Back to Handle Trigger
end
end
Command-->>ExecutableAd: Command Handled (Command ID)
ExecutableAd->ExecutableAd: Move to next state if needed
Command-->>ExecutableAd: Command Completed	(Command ID)
group Loop on all COMPLETED Fire Triggers for Command ID
ExecutableAd->ExecutableAd: Get COMPLETED Trigger
ExecutableAd->ExecutableAd: Fire COMPLETED Trigger
note left of ExecutableAd: Back to Handle Trigger
end
@enduml
```

As can be seen, firing fire-triggers and handling them is done by the ExecutableAd itself.

### Testing Strategy

Currently, any code realted to this feature is tested using only unit tests.


