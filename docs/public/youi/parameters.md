# Params

<table>
    <tr>
        <th width="250">Field name</th>
        <th width="150">Field type</th>
        <th>Expected values </th>
    </tr>
    <tr>
        <td>* "platform" <small>mandatory</small> </td>
        <td> String
        </td>
        <td>Platform type (e.g. dfw) </td>
    </tr>
    <tr>
        <td>"contentType" <small>mandatory</small> </td>
        <td>String </td>
        <td>The type of the playing asset (vod, live, recorded, rtvod)</td>
    </tr>
    <tr>
        <td>"deviceType" <small>mandatory</small> </td>
        <td>String</td>
        <td>The type of the device (e.g. firetv/tvos/roku/osprey)</td>
    </tr>
    <tr>
        <td>"deviceAdId" </td>
        <td>String </td>
        <td>Device advertising ID</td>
    </tr>
    <tr>
        <td>"userAdvrId" </td>
        <td>String</td>
        <td>Partner profile ID</td>
    </tr>
    <tr>
        <td>"fwSUSSId" </td>
        <td>String</td>
        <td> Same as "userAdvrId"</td>
    </tr>
    <tr>
        <td>"householdid" </td>
        <td>String</td>
        <td>Same as "userAdvrId"</td>
    </tr>
    <tr>
        <td>"deviceAdvrId" </td>
        <td>String</td>
        <td> Device advertising ID</td>
    </tr>
    <tr>
        <td>"userType"</td>
        <td>String</td>
        <td>2</td>
    </tr>
    <tr>
        <td>“deviceFWAdId” </td>
        <td>String</td>
        <td> Nielsen - device ad id</td>
    </tr>
    <tr>
        <td>"networkName" </td>
        <td>String</td>
        <td>The name of the network (e.g. abc)</td>
    </tr>
    <tr>
        <td>"channelId" </td>
        <td>String</td>
        <td>CCID</td>
    </tr>
    <tr>
        <td>"channelName" </td>
        <td>String</td>
        <td>The name of the channel (e.g. ESPN) if available</td>
    </tr>
    <tr>
        <td>"programName" </td>
        <td>String</td>
        <td>The name of the program (e.g. game_of_thrones)</td>
    </tr>
    <tr>
        <td>"programmerName" </td>
        <td>String</td>
        <td>The name of the programmer (e.g. Disney) </td>
    </tr>
    <tr>
        <td>"tenantName" </td>
        <td>String</td>
        <td>directv</td>
    </tr>
    <tr>
        <td>"isDuringAd" </td>
        <td>String</td>
        <td>True/False</td>
    </tr>
    <tr>
        <td>"appName" </td>
        <td>String</td>
        <td>ov/wtv/dtv</td>
    </tr>
    <tr>
        <td>"appVersion" </td>
        <td>String</td>
        <td> e.g. 1.0.103</td>
    </tr>
    <tr>
        <td>"expType" </td>
        <td>String</td>
        <td>out_of_stream / in_stream </td>
    </tr>
    <tr>
        <td>"opportunityType" </td>
        <td>String</td>
        <td>screensaver</td>
    </tr>
    <tr>
        <td>"context" </td>
        <td>String</td>
        <td>pause</td>
    </tr>
    <tr>
        <td>"adStartDelayHint" </td>
        <td>String</td>
        <td>Expected delay time form ad_init to ad_start trigger, in milliseconds</td>
    </tr>

</table>