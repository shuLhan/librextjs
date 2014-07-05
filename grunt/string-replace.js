// remove <debug> and then <debug error> and then comment /* ... */, in source files.
module.exports =
{
	options	:"<%= string_replace %>"
,	test	:
	{
		files	:
		{
			"builds/test-debug.js"	:"builds/test-dev.js"
		}
	}
,	all:
	{
		files	:
		{
			"builds/ext-all-rtl-debug.js"		:"builds/ext-all-rtl-dev-comments.js"
		,	"builds/ext-all-debug.js"			:"builds/ext-all-dev-comments.js"
		,	"builds/ext-core-debug.js"			:"builds/ext-core-dev-comments.js"
		,	"builds/ext-foundation-debug.js"	:"builds/ext-foundation-dev-comments.js"
		}
	}
,	themes:
	{
		files	:
		{
			"resources/ext-theme-neptune/ext-theme-neptune-debug.js":"resources/ext-theme-neptune/ext-theme-neptune-dev-comments.js"
		}
	}
}
