# XAAF SDK's

### Introduction

The Xandr Advertising Application Framework (XAAF) enables interactive and enriched ad experiences. This document is a guide for a hands-on integration of the XAAF SDK.

**Executable Ad**

The Executable Ad represents the lifecycle of an ad. When the host client determines there is an appropriate ad opportunity, it requests an ad from the SDK, while passing the type of an opportunity (e.g. screen saver). The SDK will create the matching executable ad instance. The executable ad handles the ad experience and its rendering, within a container view provided by the host client.

At the appropriate time, the host client will control the executable ad via its life cycle methods. The executable ad will publish events to the hosting app, notifying it about user interactions and rendering progress.
