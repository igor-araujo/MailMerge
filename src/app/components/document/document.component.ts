const ContentTools = require('assets/contentTools/content-tools.min');


import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-document',
  templateUrl: './document.component.html',
  styleUrls: ['./document.component.scss']
})
export class DocumentComponent implements OnInit {

  isShowDetails: boolean;
  isEditable: boolean;
  private editor: any;

  constructor() { }

  ngOnInit() {
    this.isShowDetails = false;
    this.isEditable = false;
    this.editor = ContentTools.EditorApp.get();
    this.editor.init('*[data-editable]', 'main-content', null, false);
  }

  showDetails(show: boolean) {
    this.isShowDetails = show;
  }

  setEditable() {
    this.isEditable = true;
    // Starting the editor manually
    this.editor.start();
  }

  saveDocument() {
    this.isEditable = false;
    // Stoping the editor manually (save)
    this.editor.stop(true);
  }

  closeDocument() {
    // Stoping the editor manually (cancel)
    if (this.editor.stop(false)) {
      this.isEditable = false;
    }
  }



}
