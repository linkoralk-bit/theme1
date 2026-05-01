import {
  Component, OnInit, OnDestroy, AfterViewInit,
  ChangeDetectorRef, ChangeDetectionStrategy, NgZone
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

interface Heart {
  id: number;
  x: number;
  size: number;
  delay: number;
  duration: number;
  colorIdx: number;
  opacity: number;
}

@Component({
  selector: 'app-event',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event.component.html',
  styleUrls: ['./event.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventComponent implements OnInit, OnDestroy, AfterViewInit {

  event: any = null;
  mapUrl!: SafeResourceUrl;
  isPlaying = false;
  rsvpSubmitted = false;
  private isOpening = false;
  // Hero typewriter
  displayGroom = '';
  displayBride = '';
  private typeIntervals: any[] = [];
  private typeTimeouts:  any[] = [];

  // Countdown
  countdown = { days: 0, hours: 0, minutes: 0, seconds: 0 };
  prevCountdown = { days: 0, hours: 0, minutes: 0, seconds: 0 };
  private timerInterval: any;

  // Background slideshow
  bgSlides: string[] = [];
  activeBgIndex = 0;
  private bgInterval: any;

  // Dust mote particles
  hearts: Heart[] = [];
  private heartIdCounter = 0;
  private heartSpawnInterval: any;

  // Gallery slideshow
  galleryIndex = 0;
  private galleryAutoInterval: any;

  // Lightbox
  showLightbox = false;
  currentIndex = 0;
  currentImage = '';

  // Template loops
  readonly filmHoles = Array(8).fill(0);

  // Unused interface compat
  readonly HEART_PATH = '';

  // Warm dust / golden mote colours
  readonly HEART_COLORS = [
    '#c8a848', // amber gold
    '#e0b060', // warm gold
    '#d09840', // deep amber
    '#c89060', // terracotta warm
    '#b8a070', // sepia warm
    '#d4b858', // sunlight
  ];

  
  constructor(
    private route:     ActivatedRoute,
    private api:       ApiService,
    private sanitizer: DomSanitizer,
    private cdr:       ChangeDetectorRef,
    private ngZone:    NgZone
  ) {}

  ngOnInit() {
    this.spawnInitialHearts();
    this.startHeartSpawner();

    const slug = this.route.snapshot.paramMap.get('slug');
    this.api.getEvent(slug!).subscribe(res => {
      this.event = res;

      this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://maps.google.com/maps?q=${encodeURIComponent(res.location)}&output=embed`
      );

      if (res.gallery?.length >= 2) {
        this.bgSlides = res.gallery.slice(0, 5);
      } else {
        this.bgSlides = [
          '/images/wedding-bg-1.jpg',
          '/images/wedding-bg-2.jpg',
          '/images/wedding-bg-3.jpg',
          '/images/wedding-bg-4.jpg',
        ];
      }

      this.startBgSlideshow();
      this.startGalleryAuto();
      this.startCountdown();
      this.cdr.detectChanges();
    });
  }

  ngAfterViewInit() {
    setTimeout(() => this.initScrollObserver(), 800);
  }

  // ── GATE OPEN ANIMATION ───────────────────────────────────
  openEnvelope(audio: HTMLAudioElement) {
    if (!this.isPlaying) {
  audio.play().then(() => {
    this.isPlaying = true;
    this.cdr.detectChanges();
  }).catch(() => {});
}

    const wrap    = document.getElementById('envelopeWrap');
    const hint    = document.getElementById('wsHint');
    const letterEl = document.getElementById('letterReveal');
    const sceneEl  = document.getElementById('envelopeScene');
    const burnEl   = document.getElementById('filmBurn');
    const coverEl  = document.getElementById('bookCover');
    const rightDoor = document.getElementById('bookCoverRight');

    if (!coverEl || !rightDoor) return;

    if (!wrap || this.isOpening) return;

this.isOpening = true;

    // Hide hint immediately
    if (hint) hint.style.opacity = '0';

    // Step 1: latch jiggles (seal-cracked class)
    wrap.classList.add('seal-cracked');

    // Step 2: gate swings open on CSS 3D hinge
    setTimeout(() => {
      if (coverEl) coverEl.classList.add('flap-open');
      if (rightDoor) rightDoor.classList.add('flap-open');
    }, 350);

    // Step 3: film burn transition fires
    setTimeout(() => {
      if (burnEl) burnEl.classList.add('burning');
    }, 900);

    // Step 4: during peak burn, swap scenes
    setTimeout(() => {
      if (sceneEl) {
        sceneEl.style.transition = 'opacity 0.4s ease';
        sceneEl.style.opacity    = '0';
        sceneEl.style.pointerEvents = 'none';
      }

      if (letterEl) {
        letterEl.style.display = 'block';
        letterEl.getBoundingClientRect(); // force reflow
        letterEl.classList.add('revealed');

        setTimeout(() => {
          this.animateNames();
          this.cdr.detectChanges();
        }, 500);

        setTimeout(() => this.initScrollObserver(), 1400);
      }
    }, 1250);

    // Step 5: remove scene from flow after burn ends
    setTimeout(() => {
      if (sceneEl) sceneEl.style.display = 'none';
      if (burnEl)  burnEl.classList.remove('burning');
    }, 2200);

    this.cdr.detectChanges();
  }

  // ── BACKGROUND SLIDESHOW ─────────────────────────────────
  startBgSlideshow() {
    this.bgInterval = setInterval(() => {
      this.activeBgIndex = (this.activeBgIndex + 1) % this.bgSlides.length;
      this.cdr.detectChanges();
    }, 6000);
  }

  isBgActive(i: number): boolean {
    return i === this.activeBgIndex;
  }

  // ── GALLERY ──────────────────────────────────────────────
  get galleryImages(): string[] { return this.event?.gallery || []; }
  get galleryDots(): number[]   { return this.galleryImages.map((_, i) => i); }

  goToSlide(n: number) {
    this.galleryIndex = (n + this.galleryImages.length) % this.galleryImages.length;
    this.cdr.detectChanges();
    this.resetGalleryAuto();
  }
  prevSlide() { this.goToSlide(this.galleryIndex - 1); }
  nextSlide() { this.goToSlide(this.galleryIndex + 1); }

  get galleryTranslate(): string {
    return `translateX(-${this.galleryIndex * 100}%)`;
  }

  startGalleryAuto() {
    this.galleryAutoInterval = setInterval(() => {
      this.galleryIndex = (this.galleryIndex + 1) % Math.max(this.galleryImages.length, 1);
      this.cdr.detectChanges();
    }, 4800);
  }
  resetGalleryAuto() {
    clearInterval(this.galleryAutoInterval);
    this.startGalleryAuto();
  }

  // ── DUST MOTES ────────────────────────────────────────────
  spawnInitialHearts() {
    for (let i = 0; i < 20; i++) {
      setTimeout(() => this.spawnHeart(), i * 400);
    }
  }

  startHeartSpawner() {
    this.ngZone.runOutsideAngular(() => {
      this.heartSpawnInterval = setInterval(() => {
        this.ngZone.run(() => {
          this.spawnHeart();
          this.cdr.detectChanges();
        });
      }, 1000);
    });
  }

  spawnHeart() {
    const id = this.heartIdCounter++;
    const heart: Heart = {
      id,
      x:        Math.random() * 100,
      size:     Math.random() * 16 + 6,
      delay:    Math.random() * 6,
      duration: Math.random() * 14 + 12,
      colorIdx: Math.floor(Math.random() * this.HEART_COLORS.length),
      opacity:  0.2 + Math.random() * 0.45,
    };
    this.hearts.push(heart);
    setTimeout(() => {
      this.hearts = this.hearts.filter(h => h.id !== id);
      this.cdr.detectChanges();
    }, (heart.duration + heart.delay + 2) * 1000);
  }

  heartColor(idx: number): string {
    return this.HEART_COLORS[idx % this.HEART_COLORS.length];
  }

  trackHeart(_: number, h: Heart): number { return h.id; }

  // ── TYPEWRITER ────────────────────────────────────────────
  // animateNames() {
  //   const groom = this.event?.groom || '';
  //   const bride = this.event?.bride || '';
  //   let i = 0;

  //   const gi = setInterval(() => {
  //     if (i < groom.length) {
  //       this.displayGroom += groom[i++];
  //       this.cdr.detectChanges();
  //     } else {
  //       clearInterval(gi);
  //       const t = setTimeout(() => {
  //         let j = 0;
  //         const bi = setInterval(() => {
  //           if (j < bride.length) {
  //             this.displayBride += bride[j++];
  //             this.cdr.detectChanges();
  //           } else { clearInterval(bi); }
  //         }, 90);
  //         this.typeIntervals.push(bi);
  //       }, 400);
  //       this.typeTimeouts.push(t);
  //     }
  //   }, 90);
  //   this.typeIntervals.push(gi);
  // }

  animateNames() {
  // prevent duplicate typing
  this.typeIntervals.forEach(clearInterval);
  this.typeTimeouts.forEach(clearTimeout);

  this.typeIntervals = [];
  this.typeTimeouts = [];

  // reset values before typing
  this.displayGroom = '';
  this.displayBride = '';

  const groom = this.event?.groom || '';
  const bride = this.event?.bride || '';

  let i = 0;

  const gi = setInterval(() => {
    if (i < groom.length) {
      this.displayGroom += groom[i];
      i++;
      this.cdr.detectChanges();
    } else {
      clearInterval(gi);

      const t = setTimeout(() => {
        let j = 0;

        const bi = setInterval(() => {
          if (j < bride.length) {
            this.displayBride += bride[j];
            j++;
            this.cdr.detectChanges();
          } else {
            clearInterval(bi);
          }
        }, 90);

        this.typeIntervals.push(bi);
      }, 400);

      this.typeTimeouts.push(t);
    }
  }, 90);

  this.typeIntervals.push(gi);
}

  // ── COUNTDOWN ─────────────────────────────────────────────
  startCountdown() {
    const target = new Date(this.event.date + 'T16:00:00');
    const run = () => {
      const diff = target.getTime() - Date.now();
      if (diff > 0) {
        const next = {
          days:    Math.floor(diff / 86_400_000),
          hours:   Math.floor((diff % 86_400_000) / 3_600_000),
          minutes: Math.floor((diff % 3_600_000)  / 60_000),
          seconds: Math.floor((diff % 60_000)     / 1_000),
        };
        this.prevCountdown = { ...this.countdown };
        this.countdown = next;
        this.cdr.detectChanges();
      } else {
        clearInterval(this.timerInterval);
      }
    };
    run();
    this.timerInterval = setInterval(run, 1000);
  }

  get fDays():    string { return String(this.countdown.days).padStart(3, '0'); }
  get fHours():   string { return String(this.countdown.hours).padStart(2, '0'); }
  get fMinutes(): string { return String(this.countdown.minutes).padStart(2, '0'); }
  get fSeconds(): string { return String(this.countdown.seconds).padStart(2, '0'); }

  tickDays():    boolean { return this.countdown.days    !== this.prevCountdown.days; }
  tickHours():   boolean { return this.countdown.hours   !== this.prevCountdown.hours; }
  tickMinutes(): boolean { return this.countdown.minutes !== this.prevCountdown.minutes; }
  tickSeconds(): boolean { return this.countdown.seconds !== this.prevCountdown.seconds; }

  // ── SCROLL OBSERVER ───────────────────────────────────────
  initScrollObserver() {
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      }),
      { threshold: 0.07 }
    );
    document.querySelectorAll('.fade-up').forEach(el => io.observe(el));
  }

  // ── LIGHTBOX ──────────────────────────────────────────────
  openLightbox(index: number) {
    this.currentIndex = index;
    this.currentImage = this.event.gallery[index];
    this.showLightbox = true;
    document.body.style.overflow = 'hidden';
    this.cdr.detectChanges();
  }

  closeLightbox(event?: MouseEvent) {
    if (!event || (event.target as HTMLElement).classList.contains('lb-overlay')) {
      this.showLightbox = false;
      document.body.style.overflow = '';
      this.cdr.detectChanges();
    }
  }

  prevLightbox() {
    this.currentIndex = (this.currentIndex - 1 + this.event.gallery.length) % this.event.gallery.length;
    this.currentImage = this.event.gallery[this.currentIndex];
    this.cdr.detectChanges();
  }

  nextLightbox() {
    this.currentIndex = (this.currentIndex + 1) % this.event.gallery.length;
    this.currentImage = this.event.gallery[this.currentIndex];
    this.cdr.detectChanges();
  }

  // ── MUSIC ─────────────────────────────────────────────────
  async toggleMusic(audio: HTMLAudioElement) {
    try {
      if (this.isPlaying) { audio.pause(); }
      else { await audio.play(); }
      this.isPlaying = !this.isPlaying;
      this.cdr.detectChanges();
    } catch (e) { console.warn(e); }
  }

  // ── RSVP ──────────────────────────────────────────────────
  submitRsvp(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = {
      name:       (form.querySelector('[name="name"]')       as HTMLInputElement).value,
      phone:      (form.querySelector('[name="phone"]')      as HTMLInputElement).value,
      guestCount: Number((form.querySelector('[name="guestCount"]') as HTMLInputElement)?.value || 1),
      attending:  (form.querySelector('[name="attending"]')  as HTMLSelectElement).value === 'true',
      eventId:    this.event._id,
    };
    this.api.submitRSVP(data).subscribe(() => {
      this.rsvpSubmitted = true;
      this.cdr.detectChanges();
    });
  }

  // ── CLEANUP ───────────────────────────────────────────────
  ngOnDestroy() {
    clearInterval(this.timerInterval);
    clearInterval(this.bgInterval);
    clearInterval(this.heartSpawnInterval);
    clearInterval(this.galleryAutoInterval);
    this.typeIntervals.forEach(clearInterval);
    this.typeTimeouts.forEach(clearTimeout);
  }
}