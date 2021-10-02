'use strict';
const ks = {};

if(!ks.sort) ks.sort = {};

if(!ks.sort.editor) ks.sort.editor = (function(){

    function Controller(){
        let moduleModel = null;
        let uiElem = null;
        this.init = function(model, ui){
            moduleModel = model;
            uiElem = ui;
            
            uiElem.input.addEventListener('keydown', this.addRow);
        }

        this.addRow = function(ev){
            moduleModel.addRow(ev);
        }
    }
    function Model(){
        let moduleView = null;
        let rows = [];

        this.init = function(view){
            moduleView = view;

        }
        
        this.addRow = function(ev){
            // 보류
            // let rowForm = (row) => {
            //     idx++;
            //     return {
            //         idx: idx,
            //         row: row
            //     }
            // };
            let target = ev.target;
            if(ev.key === 'Enter'){
                rows.push(target.value);
                moduleView.clearInput();
                this.updateTable();
            }
        }

        this.updateTable = function(){
            moduleView.updateTable(rows);
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
        this.updateTable = function(rows){
            let formedRows = '';
            let rowForm = row => `
                    <tr data-ks-sort="tr">
                        <td data-ks-sort="index">${row.idx+1}</td>
                        <td>${row.row}</td>
                        <td><span class="del-btn">&times;</span></td>
                    </tr>
            `;
            rows.forEach((row, idx)=>{
                formedRows += rowForm({row, idx});
            });
            uiElem.tbody.innerHTML = formedRows;
        }
        this.clearInput = function(){
            uiElem.input.value = '';
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
                if(i!=undefined)
                    max = Math.max(max, i.length);
            }
            console.log(attr['column'][parent])
            return attr['column'][parent]?attr['column'][parent].map(x=>`<td${attr['column'][parent].length==1 && max!=0?' colspan="'+max+'"':''}>${x}</td>`):`<td colspan="${max}">No Value</td>`;
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
                        ${this.generateTd('body')}
                    </tr>
                </tbody>
                <tfoot data-ks-sort="foot">
                    <tr data-ks-sort="tr">
                        ${this.generateTd('foot')}
                    </tr>
                </tfoot>
            </table>
            `, 'text/html').querySelector('table').innerHTML;

            uiElem.innerHTML = `${elements}`;

            div.dataset.ksSort = 'wrap';
            div.append(uiElem);
            div.append(new DOMParser().parseFromString(`<div>
            <input type="text" data-ks-sort="input">
        </div>`,'text/html').querySelector('div'))
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
                        "비고"
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
            const input = document.querySelector('[data-ks-sort="input"]');
            const tb = document.querySelector('[data-ks-sort="table"]');
            const thead = document.querySelector('[data-ks-sort="head"]');
            const tbody = document.querySelector('[data-ks-sort="body"]');
            const tfoot = document.querySelector('[data-ks-sort="foot"]');
            
            const ui = {
                body,
                wrap,
                search,
                searchBtn,
                input,
                tb,
                thead,
                tbody,
                tfoot,
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