module.exports =
{
	"test":
	[
		"builds/test*.js"
	]
,	"development":
	[
		"builds/*-dev-*.js"
	]
,	"debug":
	[
		"builds/*-debug.js"
	]
,	"sass":
	[
		".sass-cache/"
	,	"resources/ext-theme-access/*.css"
	,	"resources/ext-theme-base/*.css"
	,	"resources/ext-theme-classic/*.css"
	,	"resources/ext-theme-gray/*.css"
	,	"resources/ext-theme-neptune-charcoal/*.css"
	,	"resources/ext-theme-neptune/*.css"
	,	"resources/ext-theme-neptune/*.js"
	,	"resources/ext-theme-neutral/*.css"
	]
,	"all"	:
	[
		"builds/"
	,	"docs/"
	,	"sass"
	,	"*.js"
	,	"!file-header.js"
	,	"!Gruntfile.js"
	]
}
