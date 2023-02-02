# CRS-RUPP Integration
This is a prototype for a browser extension which shows UPD instructors' RUPP rating in the [preenlistment](https://crs.upd.edu.ph/preenlistment/) and [waitlisting](https://crs.upd.edu.ph/student_registration/) modules of CRS.

## Features

- Displays an instructor's RUPP scores (helpfulness, pedagogy, easiness, and overall) below their name
- Highlights their name based on their RUPP scores (grey if TBA, Concealed, or not found in RUPP)
- Appends a Search Reddit link below their name which leads to their [r/RateUPProfs](https://www.reddit.com/r/RateUPProfs/) search results
- Includes support for multiple instructors in a block listing

## Disclaimer

If you are a UPD student who finds this repository, feel free to use it at will. However, please take note of the following before proceeding:

- You assume all the risks in using this extension; I will not be responsible for the consequences of any use or misuse of this extension.
- The professors data found here is lifted from the old RUPP which was last updated years ago. As such, not everyone in the current roster of UPD intructors has a rating.
- Any character development that the instructors have experienced throughout the last few years, whether positive or negative, may not be accurately represented in their scores. Given that, the display of the old RUPP scores should not be treated as the sole metric of an instructor's character.

## Compatibility
- I cannot guarantee that this extension will work on your browser. It was developed and tested to be functional on the following browsers:
    - Microsoft Edge 109
    - Opera 94
- If you've installed this extension and it works for you, *please open a pull request to edit this README to add or edit information regarding your browser*.

# Installation

Since this is still a prototype, it is not yet uploaded to any extension store. So, please do the following steps to install.

### **Step 1.** Get a local copy.

You can do this by downloading the repository as a ZIP file and then extracting in your device or using git clone:

```
$ git clone https://github.com/Ulyzses/crs-rupp
```

### **Step 2.** Go to your browser's extension page.

You may visit the following URIs in your browser's address bar to go to the extension page:

- Google Chrome: `chrome://extensions`
- Microsoft Edge: `edge://extensions`
- Firefox: `about:addons`
- Opera: `opera://extensions`

### **Step 3.** Activate Developer Mode.

Activating developer mode will allow you to load unpacked extensions.

### **Step 4.** Click "Load Unpacked" and select the folder where you extracted the repository.

If you used git clone, the folder should be named `crs-rupp`. Once you've finished this step, you should see the extension in your browser's extension page. This means you've successfully installed the extension.


### **Step 5. (Optional)** Pin the extension to your toolbar.

This would allow you to easily trigger the extension when searching for classes.

# Usage

The extension should automatically be enabled when you visit a class search page in CRS (`https://crs.upd.edu.ph/*/class_search/*`). If it's still disabled, try refreshing the page.

Click on the extension icon and click the big **Rate Everyone** button on the pop-up. You should immediately see the scores and the colours of the instructors' names change.

You may also click on the "Search Reddit" button to open a new tab with the search results of the instructor's name in [r/RateUPProfs](https://reddit.com/r/RateUPProfs).

Happy enlisting!