# Salamander-Quantifier
Salamander Quantifier is your one stop shop for performing color or pattern analysis on your amphibian of choice! This site is intended for use by ecological researchers interested in improving their quantification capabilities on high-quality images taken in the field.

## Features
1. Image Segmentation - allows analysis of a specific user-determined region of the image rather than the entire thing
2. Color Analysis - provides a pixel by pixel analysis of the hex values of the colors present in your segmented region. This feature includes the following export options:

    a. Color overview (csv) - provides a high level overview of the major colors present using defined color families. This is useful if you just want to know what color families are present and which are not.

    b. 32-bin (csv) - provides a moderate level overview of the colors present by binning each RGB value to the nearest multiple of 32 (read as a range) which reduces the possible colors from 16581375 into 512 for easier comprehension. For example the color #93C958 (green) when converted to RGB is R: 147, G: 209, B: 88. These three numbers are then floored to the nearest value of 32 which is R: 128, G: 192, B: 64 which becomes #80C040 (green). The full flooring ruleset can be shown below:
        - 0–31 → 0
        - 32–63 → 32
        - 64–95 → 64
        - 96–127 → 96
        - 128–159 → 128
        - 160–191 → 160
        - 192–223 → 192
        - 224–255 → 224
    This option is most useful if you want to know the specific colors present without caring for minor shade differences or if you prefer the smaller file size.

    c. Detailed view (csv) - shows the complete, raw list of all hex values present in the region along with a counter that signifies how many times this value appeared. This is a potentially massive file with up to 16581375 rows. This is useful if you want to know if a very specific color shade is present in the region.

## Getting Started

Welcome to Salamander Quantifier! To get started simply click on the link found here: https://justinhenley33.github.io/Salamander-Quantifier/. That's it! There are no prerequistite downloads or requirements needed.

### Uploading your Image

To upload your image (png preferred), just click on the upload button in the top right corner then naviagte to the image you'd like to analyze in your file system. After uploading you should see the image appear in the center of your screen meaning it is ready for the next steps!

### Segmenting your Image

To segment a region of your image for analysis, just click on the image in the center of your screen to create a visible point. Keep clicking to create more points that will be connected via a line and start forming an area. When you have the area you'd like, double click on the starting point to finish the segmentation! You should see a light blue area defined.

### And coding style tests

Explain what these tests test and why

```
Give an example
```

## Deployment

Add additional notes about how to deploy this on a live system

## Built With

* [Dropwizard](http://www.dropwizard.io/1.0.2/docs/) - The web framework used
* [Maven](https://maven.apache.org/) - Dependency Management
* [ROME](https://rometools.github.io/rome/) - Used to generate RSS Feeds

## Contributing

Please read [CONTRIBUTING.md](https://gist.github.com/PurpleBooth/b24679402957c63ec426) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/your/project/tags). 

## Authors

* **Billie Thompson** - *Initial work* - [PurpleBooth](https://github.com/PurpleBooth)

See also the list of [contributors](https://github.com/your/project/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Hat tip to anyone whose code was used
* Inspiration
* etc
