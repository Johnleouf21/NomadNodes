"use client";

import { Card, CardContent } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <div className="container max-w-4xl py-12">
      <Card>
        <CardContent className="prose dark:prose-invert max-w-none p-8">
          <h1 className="text-3xl font-bold">Conditions Générales d&apos;Utilisation (CGU)</h1>
          <p className="text-muted-foreground">
            <strong>Nomad Nodes</strong>
            <br />
            Dernière mise à jour : décembre 2025
          </p>

          <p>
            Les présentes Conditions Générales d&apos;Utilisation (les « CGU ») encadrent
            l&apos;accès et l&apos;utilisation du site <strong>Nomad Nodes</strong> (le « Site »),
            une plateforme permettant la mise en relation entre hôtes et voyageurs, ainsi que la
            certification d&apos;avis via un mécanisme Web3 (Proof-of-Stay / SBT).
          </p>

          <p>En utilisant le Site, vous acceptez pleinement les présentes CGU.</p>

          <hr className="my-8" />

          <h2 className="text-xl font-semibold">1. Objet du service</h2>
          <p>
            Nomad Nodes est une <strong>plateforme de mise en relation</strong> entre voyageurs et
            hôtes. Le Site permet notamment :
          </p>
          <ul>
            <li>de consulter et publier des offres d&apos;hébergement,</li>
            <li>de réserver un séjour,</li>
            <li>d&apos;émettre un SBT (Soulbound Token) attestant d&apos;un séjour réel,</li>
            <li>de publier des avis certifiés à partir de cette preuve.</li>
          </ul>
          <p>
            Nomad Nodes <strong>n&apos;est pas une agence de voyage</strong>. Le contrat de séjour
            est conclu <strong>directement</strong> entre l&apos;hôte et le voyageur.
          </p>

          <hr className="my-8" />

          <h2 className="text-xl font-semibold">2. Absence de services sur actifs numériques</h2>
          <p>Les tokens utilisés sur Nomad Nodes (SBT, jetons utilitaires non transférables) :</p>
          <ul>
            <li>ne représentent aucun actif réel,</li>
            <li>ne donnent aucun droit financier,</li>
            <li>ne sont pas transférables,</li>
            <li>n&apos;ont aucune fonction d&apos;investissement.</li>
          </ul>
          <p>Ils servent uniquement à certifier une expérience (preuve de séjour, réputation).</p>
          <p>
            Nomad Nodes ne propose <strong>aucun service sur actifs numériques</strong> et ne relève
            pas du règlement MiCA ou du régime PSAN.
          </p>

          <hr className="my-8" />

          <h2 className="text-xl font-semibold">3. Données nécessaires au fonctionnement</h2>
          <p>Pour réaliser une réservation, l&apos;utilisateur doit fournir :</p>
          <ul>
            <li>nom,</li>
            <li>prénom,</li>
            <li>email,</li>
            <li>numéro de téléphone.</li>
          </ul>
          <p>
            Ces données sont utilisées <strong>uniquement</strong> pour transmettre les informations
            nécessaires à l&apos;hôte.
          </p>
          <p>
            <strong>Aucune base de données ne stocke ces informations.</strong> Elles sont envoyées
            directement par email à l&apos;hôte concerné. Le Site ne conserve aucune copie.
          </p>

          <hr className="my-8" />

          <h2 className="text-xl font-semibold">4. Réservations et paiements</h2>
          <p>Les paiements sont réalisés via un prestataire externe sécurisé.</p>
          <p>Nomad Nodes :</p>
          <ul>
            <li>ne détient pas de fonds,</li>
            <li>ne stocke aucune donnée bancaire,</li>
            <li>ne propose aucun service financier.</li>
          </ul>
          <p>
            Le smart-contract d&apos;escrow (le cas échéant) sert uniquement à automatiser la
            libération des fonds selon les conditions prévues.
          </p>

          <hr className="my-8" />

          <h2 className="text-xl font-semibold">5. Avis certifiés (Proof-of-Stay)</h2>
          <p>Un avis ne peut être publié que si :</p>
          <ul>
            <li>un séjour a réellement eu lieu,</li>
            <li>un SBT est émis dans le wallet du voyageur.</li>
          </ul>
          <p>Les avis sont strictement réservés aux voyageurs authentiques.</p>

          <hr className="my-8" />

          <h2 className="text-xl font-semibold">6. Responsabilité</h2>
          <p>Nomad Nodes ne peut être tenu responsable :</p>
          <ul>
            <li>du contenu des annonces,</li>
            <li>des comportements des hôtes ou voyageurs,</li>
            <li>des litiges commerciaux,</li>
            <li>
              du fonctionnement des services tiers (blockchain, smart-contracts, prestataires de
              paiement),
            </li>
            <li>de la disponibilité du Site ou du réseau.</li>
          </ul>
          <p>Le Site est fourni &quot;tel quel&quot;.</p>

          <hr className="my-8" />

          <h2 className="text-xl font-semibold">7. Propriété intellectuelle</h2>
          <p>
            Tous les éléments du Site (textes, logos, design, images) sont la propriété exclusive de
            Nomad Nodes.
          </p>

          <hr className="my-8" />

          <h2 className="text-xl font-semibold">8. Modifications</h2>
          <p>
            Nomad Nodes peut modifier les présentes CGU à tout moment. La date de mise à jour
            indiquée ci-dessus fait foi.
          </p>

          <hr className="my-8" />

          <h2 className="text-xl font-semibold">9. Contact</h2>
          <p>
            Pour toute question :
            <br />
            <a href="mailto:contact@nomadnodes.com" className="text-primary hover:underline">
              contact@nomadnodes.com
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
