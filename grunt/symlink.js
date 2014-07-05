module.exports =
{
	options	:
	{
		overwrite	:true
	}
,	all		:
	{
		files	:
		[{
			expand		:true
		,	overwrite	:true
		,	cwd			:"builds"
		,	src			:
			[
				"ext-all-dev.js"
			,	"ext-all-debug.js"
			,	"ext-all.js"
			]
		,	dest		:"./"
		},{
			src		: "builds/ext-core-dev.js"
		,	dest	: "ext-dev.js"
		},{
			src		: "builds/ext-core-debug.js"
		,	dest	: "ext-debug.js"
		},{
			src		: "builds/ext-core.js"
		,	dest	: "ext.js"
		}]
	}
}
