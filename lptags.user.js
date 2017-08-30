// ==UserScript==
// @name         Launchpad bug tags helper
// @namespace    https://launchpad.net/~julian-liu
// @version      0.4
// @description  LP bugs tags helper
// @author       Julian Liu
// @match        https://bugs.launchpad.net/*/+filebug
// @match        https://bugs.launchpad.net/*/+bug/*
// @connect      cedelivery.access.ly
// @grant        GM_xmlhttpRequest
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
margin: 0;  /* Ensures there is no space between sides of the screen and the menu */
z-index: 1; /* Makes sure that your menu remains on top of other page elements */
background-color: GhostWhite;
}
.navbar	{
height: 50px;
padding: 0;
padding-bottom: 10px;
margin: 0;
border-right: 1px solid #fafaff;
z-index: 12;
}
.navbar li {
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
.navbar a {
padding: 18px 0;  /* Adds a padding on the top and bottom so the text appears centered vertically */
border-left: 1px solid #fafaff;  /* Creates a border in a slightly lighter shade of blue than the background.  Combined with the right border, this creates a nice effect. */
border-right: 1px solid #fafaff; /* Creates a border in a slightly darker shade of blue than the background.  Combined with the left border, this creates a nice effect. */
text-decoration: none;  /* Removes the default hyperlink styling. */
color: #000; /* Text color is black */
display: block;
}
.navbar li:hover, a:hover {
background-color: #e5f3ff;
}
.navbar li ul {
display: none; /* Hides the drop-down menu */
margin: 0; /* Aligns drop-down box underneath the menu item */
padding: 0; /* Aligns drop-down box underneath the menu item */
margin-left: 100px;
float:left;
margin-top: -45px;
height: 0;
}
.navbar li:hover ul {
display: block; /* Displays the drop-down box when the menu item is hovered over */
z-index: 12;
padding-left: 1px;
}
.navbar li ul li {
background-color: #e1e1e7;
width: 150px;
font: normal 12px/1.2em Arial, Verdana, Helvetica;
}
.navbar li ul li a {
border-left: 1px solid #0026ff;
border-right: 1px solid #0026ff;
border-top: 1px solid #0026ff;
z-index: 1001;
}
.navbar li ul li:hover {
background-color: #d1d7e8;
z-index: 1000;
}
.checkedmark:before {
content: '✓';
}
    `;

    var css = document.createElement("style");
    css.type = "text/css";
    css.innerHTML = menuStyle;
    document.body.appendChild(css);
}

function toggleTagValue(tag) {
    var tagNode = document.getElementById('filebug-form').elements['field.tags'];
    var liNode = document.getElementById('taglist.' + tag);

    if (tagNode.value.indexOf(tag) !== -1) {
        tagNode.value = tagNode.value.replace(' ' + tag, '');
        tagNode.value = tagNode.value.replace(tag, '');
        liNode.className = '';
    }
    else {
        tagNode.value = tagNode.value + ' ' + tag;
        liNode.className = 'checkedmark';
    }
}

function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function readExternalTags(url, callback) {
    GM_xmlhttpRequest({
        method: "GET",
        url: url,
        onload: function (response) {
            if (response.status == 200) {
                callback(response.responseText);
            }
        }
    });
}

function tagList() {
    // ?q= to avoid cache
    var extTagUrl = 'https://cedelivery.access.ly/tag.json?q=';
    var intTagurl = 'https://bugs.launchpad.net/somerville/+bug/1713956?q=';
    var pubTags = {
        ihv: ['ihv-amd', 'ihv-broadcom', 'ihv-intel', 'ihv-nvidia', 'ihv-realtek', 'ihv-related'],
        status: ['task', 'staging', 'waiting', 'cqa', 'cqa-verified']
    };
    var tagDiv = document.createElement('div');
    tagDiv.id = 'wrap';
    var ulLevel1 = document.createElement('ul');
    ulLevel1.className = 'navbar';
    ulLevel1.id = 'navbartop';
    tagDiv.appendChild(ulLevel1);

    function appendCategory(tagData) {
        var topNode = document.getElementById('navbartop');

        Object.keys(tagData).forEach(function(key, index) {
            var liCategory = document.createElement('li');
            topNode.appendChild(liCategory);
            liCategory.innerHTML = liCategory.innerHTML + key + ' →';

            var ulLevel2 = document.createElement('ul');
            for (var i = 0; i < tagData[key].length; i++) {
                var liItem = document.createElement('li');
                ulLevel2.appendChild(liItem);
                liItem.innerHTML = liItem.innerHTML + tagData[key][i];
                liItem.id = 'taglist.' + tagData[key][i];
                (function(value){
                    liItem.addEventListener("click", function() {
                        toggleTagValue(value);
                    }, false);})(tagData[key][i]);
            }
            liCategory.appendChild(ulLevel2);
        });
    }

    document.getElementById('filebug-form').elements['field.tags'].size = '40';

    var targetNode = document.getElementById('filebug-form').elements['field.tags'].parentNode.parentNode.parentNode;
    insertAfter(tagDiv, targetNode);
    appendCategory(pubTags);
    addTagStyle();

    loadBugDescription(intTagurl, function(text){
        var data = JSON.parse(text);
        appendCategory(data);
    });
}

function loadExtHtml(url, callback) {
    var ajaxReq = new XMLHttpRequest();
    ajaxReq.open('GET', url, true);
    ajaxReq.onreadystatechange = function() {
        if (ajaxReq.readyState === 4 && ajaxReq.status == '200') {
            callback(ajaxReq.responseText);
        }
    };
    ajaxReq.send(null);
}

function loadBugDescription(url, callback) {
    loadExtHtml(url, function(text){
        var doc = document.implementation.createHTMLDocument("");
        doc.write(text);
        var children = doc.getElementById('edit-description').childNodes;
        for (var i=0, len=children.length; i < len; i++){
            if (children[i].className == 'yui3-editable_text-text'){
                callback(children[i].textContent);
                break;
            }
        }
    });
}

(function() {
    'use strict';

    //debugger;
    var curUrl = window.location.href;
    if (/\+filebug$/.test(curUrl)) {
        tagList();
        interceptorSetup();
    }
    else {
        console.log('');
    }
})();