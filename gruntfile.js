module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    ts: {
      default: {
        tsconfig: true
      }
    },
    jasmine_nodejs: {
      options: {
        specNameSuffix: '-spec.js', 
        helperNameSuffix: '-helper.js',
        useHelpers: false,
        random: false,
        seed: null,
        defaultTimeout: null,
        stopOnFailure: false,
        traceFatal: true
      },
      default: {
        specs: [
          'spec/**'
        ]
      }
    },
    sass: {
      default: {
        files: {
          'html/styles.css': 'styles/styles.scss'
        }
      }
    },
    clean: {
      dist: {
        options: {
          force: true,
        },
        src: [
          '../www/digitalocean/pollbot/src/**/*',
          '../www/digitalocean/pollbot/html/**/*',
          '../www/digitalocean/pollbot/vendor/**/*'
        ]
      },
      src: ['src/**/*.js', 'src/**/*.js.map']
    },
    copy: {
      dist: {
        files: [{
          expand: true,
          cwd: 'src',
          src: '**/*.js',
          dest: '../www/digitalocean/pollbot/src/'
        }, {
          expand: true,
          cwd: 'html',
          src: ['*.html', '*.css'],
          dest: '../www/digitalocean/pollbot/html/'
        }, {
          expand: true,
          cwd: 'vendor',
          src: '**/*',
          dest: '../www/digitalocean/pollbot/vendor/'
        }]
      }
    }
  });
  
  grunt.loadNpmTasks('grunt-ts');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-jasmine-nodejs');
  grunt.loadNpmTasks('grunt-sass');

  grunt.registerTask('default', ['clean:src', 'ts', 'sass', 'jasmine_nodejs']);
  grunt.registerTask('dist', ['clean:src', 'clean:dist', 'ts', 'sass', 'copy:dist']);
}