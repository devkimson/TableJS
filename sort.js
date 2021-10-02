'use strict';
const ks = {};

if(!ks.sort) ks.sort = {};

if(!ks.sort.editor) ks.sort.editor = (function(){

    function Controller(){
        this.init = function(){

        }
    }
    function Model(){
        let moduleView = null;
        let row = [];

        this.init = function(view){
            moduleView = view;

        }

        this.RowForm = function(){
            // this.
        }

        this.sortedRows = function(){

        }
    }
    function View(){
        let uiElem = null;
        this.init = function(ui){
            uiElem = ui;
            // console.log(uiElem)
        }
    }

    function Generator(){
        let uiElem = null;
        let attr = {};

        this.init = function(attributes){
            attr = attributes;
            uiElem = document.querySelector('[data-ks-sort="table"]');
            if(!uiElem){
                let tb = document.querySelector('table');
                let tf = confirm("Would you make current exists table to ks sort table?");
                tf?tb.dataset.ksSort = 'table':console.error("Please make a table that have ks sort data.");
                
                if(tf) {
                    uiElem = tb;
                    this.createAllParts();
                }
            } else {
                this.createAllParts();
            }
        }

        this.generateTd = function(parent){
            let max = 0;
            for(let i of Object.values(attr['column'])){
                max = Math.max(max, i.length);
            }
            return attr['column'][parent]?attr['column'][parent].map(x=>`<td${attr['column'][parent].length==1 && max!=0?' colspan="'+max+'"':''}>${x}</td>`):'<td>No Value</td>';
        }

        this.createAllParts = function(){
            let dom = new DOMParser();
            let div = uiElem.insertAdjacentElement('beforeBegin', document.createElement('div'));
            let search = document.createElement('input');
            let searchBtn = document.createElement('button');
            
            Object.assign(search,{
                className: "search-bar",
                type: "text",
            });
            Object.assign(searchBtn,{
                className: "search-btn",
                innerText: "search",
                type: "button",
            });

            let searchWrap = div.cloneNode();
            
            let elements = dom.parseFromString(`
            <table>
                <thead data-ks-sort="head">
                    <tr data-ks-sort="tr">
                        ${this.generateTd('head')}
                    </tr>
                </thead>
                <tbody data-ks-sort="body">
                    <tr>
                        <td>No Contents.</td>
                    </tr>
                </tbody>
                <tfoot data-ks-sort="foot">
                    <tr data-ks-sort="tr">
                        ${this.generateTd('foot')}
                    </tr>
                </tfoot>
            </table>
            `, 'text/html').querySelector('table').innerHTML;

            uiElem.innerHTML = elements;

            div.dataset.ksSort = 'wrap';
            div.append(uiElem);
            searchWrap.prepend(search, searchBtn);
            div.prepend(searchWrap);
        }
    }

    return {

        init: function(attributes){
            const attr = attributes || {
                column: {
                    head: [
                        "구분",
                        "내용",
                        "값"
                    ],
                    foot: [
                        "made by kimson"
                    ]
                }
            };
            this.checkValid(attr);
            const body = document.body;
            const wrap = document.querySelector('[data-ks-sort="wrap"]');
            const search = document.querySelector('.search');
            const searchBtn = document.querySelector('.searchBtn');
            const tb = document.querySelector('[data-ks-sort="table"]');
            
            const ui = {
                body,
                wrap,
                search,
                searchBtn,
                tb,
            }

            const view = new View();
            const model = new Model();
            const controller = new Controller();

            view.init(ui);
            model.init(view);
            controller.init(model, ui);
        },
        checkValid: function(attributes){
            const gt = new Generator();
            gt.init(attributes);
        }

    }
})();