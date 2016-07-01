module.exports = function(grunt) {
    grunt.initConfig({
        // Merge the JS files
        concat: {
            options: {
                process: function(src, filepath) {
                    var arr = [
                        "// "+filepath,
                        "// =================================================",
                        src
                    ];
                    if (filepath.split("header").length > 1) {
                        arr = [src];
                    }
                    return arr.join("\n");
                },
                separator: "\n\n"
            },
            dist: {
                src: ["src/prototypes.js", "src/classes/**/*.js", "src/*.js"],
                dest: "dist/main.js"
            }
        },
        watch: {
            scripts: {
                files: ["src/**/*.js", "src/*.js"],
                tasks: ["concat"],
                options: {
                    spawn: false
                }
            }
        }
    });

    // Import the required files
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-watch");

    // Set default task to do everything
    grunt.registerTask("default", ["concat"]);
};

