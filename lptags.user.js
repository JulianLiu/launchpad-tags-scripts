// ==UserScript==
// @name         Launchpad bug tags helper
// @namespace    https://launchpad.net/~julian-liu
// @version      0.1
// @description  LP bugs helper
// @author       Julian Liu
// @match        https://bugs.launchpad.net/*/+filebug
// @grant        none
// ==/UserScript==

function interceptorSetup() {
    // override submit handling
    HTMLFormElement.prototype.real_submit = HTMLFormElement.prototype.submit;
    HTMLFormElement.prototype.submit = interceptor;

    document.getElementById('filebug-form').addEventListener('submit', function(e) {
        // stop the form from submitting
        e.preventDefault();

        interceptor(e);
    }, true);
}

function interceptor(e) {
	var frm = e ? e.target : this;

    tagNode = frm.elements['field.tags'];

	if (tagNode.value.length === 0) {
		var check = confirm('No tags entered. Are you sure to submit this bug without any tag?');
		if (!check) {
			return;
		}
	}
    // submit default is prevented, so we add new submit node instead
    submitNode = document.createElement('input');
    submitNode.name = 'field.actions.submit_bug';
    submitNode.type = 'text';
    submitNode.value = 'Submit Bug Report';
    frm.appendChild(submitNode);
    HTMLFormElement.prototype.real_submit.apply(frm);
}

function addTagStyle() {
    var menuStyle = `
#wrap {
	width: 100px;
	height: 50px;
    padding-bottom: 10px;
	margin: 0; /* Ensures there is no space between sides of the screen and the menu */
	z-index: 1; /* Makes sure that your menu remains on top of other page elements */
	//position: fixed;
	background-color: GhostWhite;
	}
.navbar	{
	height: 50px;
    padding: 0;
    padding-bottom: 10px;
	margin: 0;
	//position: fixed; /* Ensures that the menu doesn’t affect other elements */
	border-right: 1px solid #fafaff;
    z-index: 12;
	}
.navbar li 	{
            padding-bottom: 10px;
			height: auto;
			width: 100px;  /* Each menu item is 100px wide */
			/*float: left;   This lines up the menu items horizontally */
            object-position: top;
			text-align: center;  /* All text is placed in the center of the box */
			list-style: none;  /* Removes the default styling (bullets) for the list */
			font: normal bold 12px/1.2em Arial, Verdana, Helvetica;
			padding: 0;
			margin: 0;
			background-color: GhostWhite;
            }
.navbar a	{
		padding: 18px 0;  /* Adds a padding on the top and bottom so the text appears centered vertically */
		border-left: 1px solid #fafaff; /* Creates a border in a slightly lighter shade of blue than the background.  Combined with the right border, this creates a nice effect. */
		border-right: 1px solid #fafaff; /* Creates a border in a slightly darker shade of blue than the background.  Combined with the left border, this creates a nice effect. */
		text-decoration: none;  /* Removes the default hyperlink styling. */
		color: #000; /* Text color is black */
		display: block;
		}
.navbar li:hover, a:hover {
    background-color: #e5f3ff;
}
.navbar li ul 	{
		display: none; /* Hides the drop-down menu */
		margin: 0; /* Aligns drop-down box underneath the menu item */
		padding: 0; /* Aligns drop-down box underneath the menu item */
        margin-left: 100px;
        float:left;
        margin-top: -45px;
        height: 0;
		}
.navbar li:hover ul 	{
                        display: block; /* Displays the drop-down box when the menu item is hovered over */
                        z-index: 12;
                        padding-left: 1px;
                        }
.navbar li ul li {
    background-color: #e1e1e7;
    width: 150px;
    font: normal 12px/1.2em Arial, Verdana, Helvetica;
}
.navbar li ul li a 	{
		border-left: 1px solid #0026ff;
		border-right: 1px solid #0026ff;
		border-top: 1px solid #0026ff;
        z-index: 1001;
		}
.navbar li ul li:hover {
    background-color: #d1d7e8;
    z-index: 1000;
}
    `;

    var css = document.createElement("style");
    css.type = "text/css";
    css.innerHTML = menuStyle;
    document.body.appendChild(css);
}

function appendTagValue(tag) {
    var tagNode = document.getElementById('filebug-form').elements['field.tags'];
    tagNode.value = tagNode.value + ' ' + tag;
}

function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function tagList() {
    var allTags = {
        function: ['wifi', 'bluetooth', 'wwan', 'hibernate', 'battery', 'graphic', 'audio', 'hotkey', 'backlight'],
        platform: ['armani-kbl-15', 'astro-mlk-14-15', 'breckenridge-mlk-kbl', 'loki-kblr', 'steamboat-mlk', 'turis-mlk-glk', 'vegas-mlk-glk'],
        hwe: ['hwe-audio', 'hwe-bluetooth', 'hwe-cert-risk', 'hwe-firmware', 'hwe-fwts-error', 'hwe-graphics', 'hwe-hotkeys', 'hwe-needs-public-bug', 'hwe-suspend-resume'],
        ihv: ['ihv-amd', 'ihv-intel', 'ihv-nvidia', 'ihv-realtek', 'ihv-related'],
        status: ['task', 'staging', 'waiting', 'cqa-verified']
    };
    var tagDiv = document.createElement('div');
    tagDiv.id = 'wrap';
    var ulLevel1 = document.createElement('ul');
    ulLevel1.className = 'navbar';
    tagDiv.appendChild(ulLevel1);

    Object.keys(allTags).forEach(function(key, index) {
        var liCategory = document.createElement('li');
        ulLevel1.appendChild(liCategory);
        liCategory.innerHTML = liCategory.innerHTML + key + ' →';

        var ulLevel2 = document.createElement('ul');
        for (var i = 0; i < allTags[key].length; i++) {
            var liItem = document.createElement('li');
            ulLevel2.appendChild(liItem);
            liItem.innerHTML = liItem.innerHTML + allTags[key][i];
            (function(value){
                liItem.addEventListener("click", function() {
                    appendTagValue(value);
                }, false);})(allTags[key][i]);
        }
        liCategory.appendChild(ulLevel2);
    });

    var targetNode = document.getElementById('filebug-form').elements['field.tags'].parentNode.parentNode.parentNode;
    insertAfter(tagDiv, targetNode);
    addTagStyle();
}

(function() {
    'use strict';

    //debugger;
    tagList();
    interceptorSetup();
})();