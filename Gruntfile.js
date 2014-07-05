module.exports = function (grunt) {
	require ('load-grunt-config') (grunt, {
		init	:true
	,	data	:
		{
			banner 			: grunt.file.read ("file-header.js")
		,	string_replace	:
			{
				replacements:
				[{  // replace code in //<debug> ... // </debug>
					pattern		:/\s+?\/\/(\/|\s)?<debug>(.|\s)+?\/\/(\/|\s)?<\/debug>/g
				,	replacement	:""
				},{ // replace code in //<debug error> ... // </debug>
					pattern		:/\s+?\/\/(\/|\s)?<debug error>(.|\s)+?\/\/(\/|\s)?<\/debug>/g
				,	replacement	:""
				},{ // replace /* ... */ comment
					pattern		:/\s+\/\*\*?(.|\s)+?\*\//g
				,	replacement	:""
				},{ // replace // comment
					pattern		:/^\s*\/\/.*$/gm
				,	replacement	:""
				}]
			}
		,	remove_banners	:
			{
				stripBanners	: true
			}
		,	include_banners	:
			{
				stripBanners	: false
			,	banner			: "<%= banner %>"
			}
		}
	});
};
