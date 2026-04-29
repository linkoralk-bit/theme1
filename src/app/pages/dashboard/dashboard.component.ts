import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {

  event: any;
  rsvps: any[] = [];
  filteredRsvps: any[] = [];

  totalGuests = 0;
  attendingCount = 0;
  notAttendingCount = 0;

  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService
  ) {}

  ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug');

    this.api.getEvent(slug!).subscribe((event) => {
      this.event = event;

      this.api.getRsvps(event._id).subscribe((data: any) => {
        this.rsvps = data;
        this.filteredRsvps = [...data]; // Copy for filtering

        this.calculateStats();

        this.isLoading = false;
      });
    });
  }

  calculateStats() {
    this.totalGuests = this.rsvps.reduce(
      (sum: number, r: any) => sum + (r.guestCount || 1), 0
    );

    this.attendingCount = this.rsvps
      .filter((r: any) => r.attending)
      .reduce((sum: number, r: any) => sum + (r.guestCount || 1), 0);

    this.notAttendingCount = this.rsvps
      .filter((r: any) => !r.attending)
      .reduce((sum: number, r: any) => sum + (r.guestCount || 1), 0);
  }

  // =========================
  // 🔎 SEARCH / FILTER
  // =========================
  filterGuests(event: any) {
    const searchTerm = event.target.value.toLowerCase().trim();

    if (!searchTerm) {
      this.filteredRsvps = [...this.rsvps];
      return;
    }

    this.filteredRsvps = this.rsvps.filter(r => 
      r.name.toLowerCase().includes(searchTerm)
    );
  }

  // =========================
  // 📥 EXPORT CSV (Excel)
  // =========================
  exportToCSV() {
    const headers = ['Name', 'Phone', 'Guests', 'Status'];

    const rows = this.rsvps.map(r => [
      r.name,
      r.phone,
      r.guestCount || 1,
      r.attending ? 'Attending' : 'Not Attending'
    ]);

    const csvContent = [headers, ...rows]
      .map(e => e.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${this.event?.slug || 'wedding'}-rsvp.csv`);
    link.click();
  }

  // =========================
  // 📱 WHATSAPP
  // =========================
  openWhatsApp(phone: string, name: string) {
    const formatted = phone.replace(/^0/, '94'); // Sri Lanka format

    const message = encodeURIComponent(
      `Hi ${name}, thank you for your RSVP ❤️\n\nLooking forward to seeing you at our wedding!`
    );

    const url = `https://wa.me/${formatted}?text=${message}`;
    window.open(url, '_blank');
  }
}