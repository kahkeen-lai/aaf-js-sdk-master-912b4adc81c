enum ExperienceTitle {
  YOUI_AD_SCRIPT_SHOW_VIDEO = 'Youi-Ad-Script-Show-Video',
  YOUI_PAUSE_TRIAL_RONEN = 'Youi-Pause-Try-Ronen-Dynamic-View',
  YOUI_PAUSE_AD_SCRIPT_SHOW_DYNAMIC_VIEW_VIDEO = 'Youi-Pause-NoTheTake-Ad-Script-Dynamic-Show-Video-Try',
  YOUI_PAUSE_AD_SCRIPT_PRE_ROLL = 'Youi-Pause-Show-Dynamic-PreRoll-ShouldWork',
  YOUI_PAUSE_AD_SCRIPT_NO_THE_TAKE = 'Youi-Pause-Show-Dynamic-PreRoll-NoTheTake',
  YOUI_PAUSE_AD_SCRIPT_DYNAMIC_VIEW_SHOES = 'Youi-Ad-Script-Show-Dynamic-Shoes',
  YOUI_PAUSE_AD_SCRIPT_DYNAMIC_VIEW_TEXT = 'Youi-Ad-Script-Show-Dynamic-Text',
  YOUI_PAUSE_SHOW_DYNAMIC_VIEW = 'Youi-Pause-Show-Dynamic',
  YOUI_PAUSE_SHOW_VIDEO = 'Youi-Pause-Show-Video',
  YOUI_PAUSE_SHOW_IMAGE = 'Youi-Pause-Show-Image',
  YOUI_PAUSE_SHOW_IMAGE_WITH_REPORT = 'Youi-Pause-Show-Image-With-Report',
  YOUI_PAUSE_SQUEEZE_SHOW_DYNAMIC = 'Youi-Pause-Squeeze-Show-Dynamic',
  YOUI_PAUSE_SHOW_VIDEO_SEND_REQUEST_TO_HOST = 'Youi-Pause-Show-Video-Send-Request-To-Host',
  BINGE_AD = 'Binge Ad'
}

export enum BingeAdStep {
  PRE_ROLL = 'preroll',
  MID_ROLL = 'midroll',
  POST_ROLL = 'postroll'
}

const experienceTitles = Object.values(ExperienceTitle);

export class Experiences {
  static getDefaultTitle(): string {
    return ExperienceTitle.YOUI_PAUSE_SHOW_VIDEO;
  }

  static getTitles(): string[] {
    return experienceTitles;
  }
}
