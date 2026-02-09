import { Component, ElementRef, OnInit, output, ViewChild } from '@angular/core';
import { MemberParams } from '../../../types';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-filter-modal',
  imports: [FormsModule],
  templateUrl: './filter-modal.html',
  styleUrl: './filter-modal.css',
})
export class FilterModal implements OnInit {
  @ViewChild('filterModal') modalRef!: ElementRef<HTMLDialogElement>;
  closeModal = output();
  submitData = output<MemberParams>();
  memberParams = new MemberParams();

  ngOnInit(): void {
    const filters = localStorage.getItem('filters');
    if (filters) {
      this.memberParams = JSON.parse(filters);
    }
  }

  open() {
    this.modalRef.nativeElement.showModal();
  }

  close() {
    this.modalRef.nativeElement.close();
    this.closeModal.emit();
  }

  submit() {
    this.submitData.emit(this.memberParams);
    this.close();
  }

  onMinAgeChange() {
    if (this.memberParams.minAge < 18) this.memberParams.minAge = 18;
  }

  onMaxAgeChange() {
    if (this.memberParams.maxAge < this.memberParams.minAge) {
      this.memberParams.maxAge = this.memberParams.minAge;
    }
  }
}
