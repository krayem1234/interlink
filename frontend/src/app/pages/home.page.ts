import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatChipsModule, RouterLink],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss'
})
export class HomePage {
  readonly services = [
    'Auth MS',
    'Student MS',
    'Company MS',
    'Offer MS',
    'Application MS',
    'Messaging MS',
    'Notification MS'
  ];

  readonly highlights = [
    {
      title: 'Candidatures fluides',
      text: 'Un parcours clair pour postuler, suivre et finaliser chaque stage.'
    },
    {
      title: 'Validation entreprise',
      text: 'Les entreprises sont vérifiées avant publication des offres.'
    },
    {
      title: 'IA utile',
      text: 'Lecture de CV, matching d’offres et recommandations ciblées.'
    }
  ];
}
