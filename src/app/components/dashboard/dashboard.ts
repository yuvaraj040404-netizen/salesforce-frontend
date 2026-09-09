import { CommonModule } from '@angular/common';
import { Component, OnInit , ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';


import { SalesforceService } from '../../service/salesforce.service';
import {
  SalesforceRecord
} from '../../models/salesforce.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {

  loggedIn = false;


  objects = [
    'Account',
    'Opportunity',
    'Lead',
    'Contact',
    'Case'
  ];

  selectedObject = 'Account';

  records: SalesforceRecord[] = [];

  columns: string[] = [];

  offset = 0;
  limit = 20;

  loading = false;
  hasMore = true;

  errorMessage = '';

  showForm = false;
  editing = false;

  selectedRecord: SalesforceRecord | null = null;

  formData: any = {};

  constructor(
    private salesforceService: SalesforceService,
    private cdr: ChangeDetectorRef
  ) {}

ngOnInit(): void {
  console.log('Dashboard initialized');

  this.salesforceService.isLoggedIn().subscribe({
    next: (loggedIn) => {
      console.log('Logged in:', loggedIn);

      this.loggedIn = loggedIn;

      if (loggedIn) {
        console.log('Calling loadRecords...');
        this.loadRecords();
      }
    },

    error: (error) => {
      console.error('Auth status error:', error);
      this.loggedIn = false;

    }
  });
}

  login(): void {
    window.location.href =
      'http://localhost:8080/oauth2/authorization/salesforce';
  }

 changeObject(): void {
  if (!this.loggedIn) {
    return;
  }

  this.records = [];
  this.columns = [];
  this.offset = 0;
  this.hasMore = true;

  this.loadRecords();
}

loadRecords(): void {
  if (!this.loggedIn) {
    return;
  }

  this.loading = true;
  this.errorMessage = '';

  this.salesforceService
    .getRecords(
      this.selectedObject,
      this.offset,
      this.limit
    )
    .subscribe({
      next: (response) => {
        console.log('API RESPONSE:', response);

        this.records = [
          ...this.records,
          ...response.records
        ];

        this.columns = this.getColumns();

        this.hasMore =
          response.records.length === this.limit;

        this.loading = false;

        console.log('Records count:', this.records.length);
        console.log('Columns:', this.columns);

        // Force Angular to update the view
        setTimeout(() => {
          this.cdr.detectChanges();
        });
      },

      error: (error) => {
        console.error('Salesforce error:', error);

        this.errorMessage =
          'Failed to load Salesforce records.';

        this.loading = false;

        setTimeout(() => {
          this.cdr.detectChanges();
        });
      }
    });
}

  loadMore(): void {

    if (this.loading || !this.hasMore) {
      return;
    }

    this.offset += this.limit;

    this.loadRecords();
  }


  getColumns(): string[] {

    if (this.records.length === 0) {
      return [];
    }

    return Object.keys(this.records[0]);
  }

  openCreate(): void {

    this.editing = false;
    this.selectedRecord = null;

    this.formData =
      this.getDefaultForm();

    this.showForm = true;
  }

  openEdit(record: SalesforceRecord): void {

    this.editing = true;

    this.selectedRecord = record;

    this.formData = {
      ...record
    };

    this.showForm = true;
  }

  getDefaultForm(): any {

    switch (this.selectedObject) {

      case 'Account':
        return {
          Name: ''
        };

      case 'Opportunity':
        return {
          Name: '',
          StageName: 'Prospecting',
          CloseDate: this.getToday()
        };

      case 'Lead':
        return {
          FirstName: '',
          LastName: '',
          Company: ''
        };

      case 'Contact':
        return {
          FirstName: '',
          LastName: ''
        };

      case 'Case':
        return {
          Subject: '',
          Status: 'New',
          Origin: 'Web'
        };

      default:
        return {};
    }
  }

  getToday(): string {

    return new Date()
      .toISOString()
      .split('T')[0];
  }

  saveRecord(): void {

  console.log('Selected object:', this.selectedObject);
  console.log('Form data:', this.formData);

  if (this.editing && this.selectedRecord) {
    const data = {
      ...this.formData
    };

    delete data.Id;

    this.salesforceService
      .updateRecord(
        this.selectedObject,
        this.selectedRecord['Id'],
        data
      )
      .subscribe({
        next: () => {
          this.closeForm();
          this.refreshRecords();
        },
        error: (error) => {
          console.error(error);
          this.errorMessage =
            'Failed to update record.';
        }
      });

  } else {

    this.salesforceService
      .createRecord(
        this.selectedObject,
        this.formData
      )
      .subscribe({
        next: () => {
          this.closeForm();
          this.refreshRecords();
        },
        error: (error) => {
          console.error(error);
          this.errorMessage =
            'Failed to create record.';
        }
      });
  }
}  

  logout(): void {
 window.location.href =
  `${environment.apiUrl}/oauth2/authorization/salesforce`;
}

 deleteRecord(record: SalesforceRecord): void {
  const id = record['Id'];

  if (!confirm(
    `Delete this ${this.selectedObject} record?`
  )) {
    return;
  }

  this.salesforceService
    .deleteRecord(
      this.selectedObject,
      id
    )
    .subscribe({
      next: () => {
        this.refreshRecords();
      },
      error: (error) => {
        console.error(error);
        this.errorMessage =
          'Failed to delete record.';
      }
    });
}

refreshRecords(): void {
  if (!this.loggedIn) {
    return;
  }

  this.records = [];
  this.columns = [];
  this.offset = 0;
  this.hasMore = true;

  this.loadRecords();
}

  closeForm(): void {

    this.showForm = false;

    this.formData = {};

    this.selectedRecord = null;
  }

  formatColumn(column: string): string {

    return column
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, char => char.toUpperCase());
  }
}