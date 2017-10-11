// ==UserScript==
// @name         Launchpad bug tags helper
// @namespace    https://launchpad.net/~julian-liu
// @version      1.7
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
position: relative;
z-index: 999;
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

function toggleTagValue(formId, tagElement, tag) {
    var tagNode = document.getElementById(formId).elements[tagElement];
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

// This function is used by tag editing page only
// Filing new bug page will always show tag listing
function toggleTagHidden() {
    var divNode = document.getElementById('wrap');
    var planNode = document.getElementById('timeline-container');
    if (divNode.className === 'hidden') {
        divNode.className = '';
        divNode.style.display = 'inline-block';
        if (planNode !== null) {
            planNode.className = 'hidden';
            planNode.style.display = '';
        }

        var inputNode = document.getElementById('tags-form').elements['tag-input'];
        inputNode.size = 40;

        // iterate tag content to show correct checkmark
        inputNode.value.split(' ').forEach(function(tagName) {
            var liNode = document.getElementById('taglist.' + tagName);
            if (liNode !== null) {
                liNode.className = 'checkedmark';
            }
        });
    }
    else {
        divNode.className = 'hidden';
        divNode.style.display = '';
        if (planNode !== null) {
            planNode.className = 'yui3-widget yui3-timelinegraph';
            planNode.style.display = 'block';
        }
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

function tagList(formId, tagElement, targetNode) {
    // ?q= to avoid cache
    var extTagUrl = 'https://cedelivery.access.ly/tag.json?q=';
    var intTagurl = 'https://bugs.launchpad.net/somerville/+bug/1713956?q=';
    var pubTags = {
        ihv: ['ihv-amd', 'ihv-broadcom', 'ihv-intel', 'ihv-nvidia', 'ihv-realtek', 'ihv-qualcomm', 'ihv-emulex', 'ihv-alps', 'ihv-synaptics', 'ihv-unknown'],
        status: ['task', 'staging', 'waiting', 'cqa-verified', 'not-fixed-at-gm']
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
                        toggleTagValue(formId, tagElement, value);
                    }, false);})(tagData[key][i]);
            }
            liCategory.appendChild(ulLevel2);
        });
    }

    insertAfter(tagDiv, targetNode);
    appendCategory(pubTags);
    addTagStyle();

    loadBugDescription(intTagurl, function(text){
        console.log('External data loaded');
        var data = JSON.parse(text);
        for (var keyname in data.tags) {
            data.tags[keyname].sort();
        }
        appendCategory(data.tags);
        loadPlatformPlan(data.plan);
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
        doc.documentElement.innerHTML = text;
        var children = doc.getElementById('edit-description').childNodes;
        for (var i=0, len=children.length; i < len; i++){
            if (children[i].className == 'yui3-editable_text-text'){
                callback(children[i].textContent);
                break;
            }
        }
    });
}

function setupOberver() {
    var attrObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.attributeName === 'class') {
                toggleTagHidden();
            }
        });
    });

    var childObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                var tagFormNode = document.getElementById('tags-form');
                if (tagFormNode !== null) {
                    attrObserver.observe(tagFormNode,  {
                        attributes: true,
                    });
                }
            }
        });
    });

    var formNode = document.getElementById('tags-form');
    if (formNode === null) {
        // bind dom insert event first, since the target element we want to
        // listen for attribute change is not existed yet
        childObserver.observe(document.getElementById('bug-tags'),  {
            childList: true
        });
    }
    else {
        attrObserver.observe(formNode,  {
            attributes: true,
        });
    }
}

function addDueDate(data) {
    var table = document.getElementById('affected-software');

    for (var i = 1; i < table.rows.length; i = i + 2) {
        if (table.rows[i].cells.length) {
            var milestoneCell = table.rows[i].cells[5];
            var dueDiv = document.createElement('div');
            var aCanDate = new Date(data);
            var nowDate = new Date();
            var dueDate;

            // if not the first row of series
            if (table.rows[i].cells[1].children.length > 1) {
                var seriesName = table.rows[i].cells[1].children[1].innerHTML;

                // Insert the due date at Hwe-* milestone td
                if (seriesName.startsWith('Hwe-')) {
                    while(milestoneCell.firstChild) {
                        milestoneCell.removeChild(milestoneCell.firstChild);
                    }
                    // Due date is 14 days before A-CAN
                    dueDate = new Date(aCanDate.getTime() - (14 * 24 * 60 * 60 * 1000));
                    dueDiv.textContent = 'Due date: ' + dueDate.getFullYear() + '/' + (dueDate.getMonth() + 1) + '/' + dueDate.getDate();
                    if (nowDate > dueDate) {
                        dueDiv.style.color = 'Red';
                    }
                    milestoneCell.appendChild(dueDiv);
                }
            }
            else {
                var seriesMain = table.rows[i].cells[1].children[0].children[0].children[0].innerText;
                if(seriesMain.startsWith('somerville')) {
                    while(milestoneCell.firstChild) {
                        milestoneCell.removeChild(milestoneCell.firstChild);
                    }
                    // Due date is 7 days before A-CAN
                    dueDate = new Date(aCanDate.getTime() - (7 * 24 * 60 * 60 * 1000));
                    dueDiv.textContent = 'Due date: ' + dueDate.getFullYear() + '/' + (dueDate.getMonth() + 1) + '/' + dueDate.getDate();
                    if (nowDate > dueDate) {
                        dueDiv.style.color = 'Red';
                    }
                    milestoneCell.appendChild(dueDiv);
                }
            }
        }
    }
}

function loadPlatformPlan(data) {
    var tagsDiv = document.getElementById('bug-tags');
    if (tagsDiv !== null) {
        var planDiv = document.createElement('div');
        var planHead = document.createElement('span');

        planDiv.id = 'bug-plan';

        var timelineList = [];
        var maxLandmarksLength = 0;

        for (let tagName of document.getElementById('tag-list').textContent.split(' ')) {
            var tagNameTrimmed = tagName.trim();
            var timelineData = {
                'is_development_focus': false,
                'landmarks': [],
                'name': tagNameTrimmed,
                'status': 'Active Development',
                'uri': ''
            };
            if (tagNameTrimmed.length > 0 && tagNameTrimmed in data) {
                for (var milestone in data[tagNameTrimmed]) {
                    if (/.*Report$/.test(milestone)) {
                        // skip * report date
                        continue;
                    }

                    if (milestone == 'A-CAN' || milestone == 'GM to QA') {
                        addDueDate(data[tagNameTrimmed][milestone]);
                    }
                    var landmarksData = {type: 'milestone', uri: ''};
                    landmarksData.code_name = milestone;
                    landmarksData.name = milestone + '(' + data[tagNameTrimmed][milestone].substring(5) + ')';
                    landmarksData.date = data[tagNameTrimmed][milestone];
                    if (new Date() > new Date(landmarksData.date)) {
                        landmarksData.type = 'release';
                    }
                    else {
                        // check if there's no previous arrow in landmarks
                        var arrows = timelineData.landmarks.filter(function(data){
                            return data.type == 'arrow';
                        });
                        if (arrows.length === 0) {
                            landmarksData.type = 'arrow';
                        }
                    }
                    timelineData.landmarks.unshift(landmarksData);
                }

                timelineList.push(timelineData);
                maxLandmarksLength = Math.max(maxLandmarksLength, timelineData.landmarks.length);
            }
        }
        if (timelineList.length > 0) {
            planHead.textContent = 'Plan: ';
            // Insert head as first child
            planDiv.insertAdjacentElement('afterbegin', planHead);
            tagsDiv.appendChild(planDiv);

            var timelineDiv = document.createElement('div');
            timelineDiv.id = 'timeline-container';
            timelineDiv.className = 'yui3-widget yui3-timelinegraph';
            planDiv.appendChild(timelineDiv);
        }

        // assume YUI is loaded by original page
        LPJS.use('lp.registry.timeline', function (Y) {
            if (timelineList.length === 0) {
                return;
            }
            var container = Y.one('#timeline-container');
            container.setStyle('display', 'block');
            var config = {
                timeline: timelineList,
                boundingBox: container
            };
            var graph = new Y.lp.registry.timeline.TimelineGraph(config);
            graph.render();
            // zoom out graph by landmark counts
            if (maxLandmarksLength > 6) {
                graph.graph_scale /= 1.1;
                graph.syncUI();
            }

            // reset fixed position
            Y.all('.yui3-timelinegraph-zoom-box').setStyle('position', '');
        });
    }
}

(function() {
    'use strict';

    //debugger;
    var anchorNode, tagNode;
    var curUrl = window.location.href;
    if (/\+filebug$/.test(curUrl)) {
        anchorNode = document.getElementById('filebug-form').elements['field.tags'].parentNode.parentNode.parentNode;
        tagNode = document.getElementById('filebug-form').elements['field.tags'];

        // enlarge text input size
        tagNode.size = '40';
        tagList('filebug-form', 'field.tags', anchorNode);
        interceptorSetup();
    }
    else {
        anchorNode = document.getElementById('bug-tags').childNodes[8];

        tagList('tags-form', 'tag-input', anchorNode);
        toggleTagHidden();
        setupOberver();
    }
})();
