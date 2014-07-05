module.exports =
{
	options	:
	{
		mangle				:true
	,	preserveComments	:false
	}
,	test	:
	{
		files	:
		{
			"builds/test.js"			:"builds/test-debug.js"
		}
	}
,	all		:
	{
		files	:
		{
			"builds/ext-all-rtl.js"		:"builds/ext-all-rtl-debug.js"
		,	"builds/ext-all.js"			:"builds/ext-all-debug.js"
		,	"builds/ext-core.js"		:"builds/ext-core-debug.js"
		,	"builds/ext-foundation.js"	:"builds/ext-foundation-debug.js"
		}
	}
,	themes:
	{
		files	:
		{
			"resources/ext-theme-neptune/ext-theme-neptune.js":"resources/ext-theme-neptune/ext-theme-neptune-debug.js"
		}
	}
}
