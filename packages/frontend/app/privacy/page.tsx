"use client";

import { Card, CardContent } from "@/components/ui/card";
import { VictorEasterEgg, VictorDateTrigger } from "@/components/easter-eggs/victor-easter-egg";

export default function PrivacyPage() {
  return (
    <VictorEasterEgg>
      <div className="container px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardContent className="prose dark:prose-invert max-w-none p-8">
              <h1 className="text-3xl font-bold">Politique de Confidentialité</h1>
              <p className="text-muted-foreground">
                <strong>Nomad Nodes</strong>
                <br />
                <VictorDateTrigger>Dernière mise à jour : décembre 2025</VictorDateTrigger>
              </p>

              <p>
                La présente Politique de Confidentialité explique quelles données sont collectées
                sur le Site Nomad Nodes et comment elles sont traitées. Nomad Nodes respecte
                pleinement le <strong>RGPD</strong>.
              </p>

              <hr className="my-8" />

              <h2 className="text-xl font-semibold">1. Données collectées</h2>
              <p>
                Nomad Nodes collecte uniquement les données strictement nécessaires au
                fonctionnement de la réservation :
              </p>
              <ul>
                <li>Nom</li>
                <li>Prénom</li>
                <li>Adresse email</li>
                <li>Numéro de téléphone</li>
              </ul>
              <p>
                Aucune autre donnée personnelle n&apos;est demandée. Aucun document d&apos;identité
                n&apos;est requis. Aucune donnée bancaire n&apos;est collectée.
              </p>
              <p>
                Lors de l&apos;utilisation Web3, l&apos;utilisateur peut connecter un{" "}
                <strong>wallet</strong>, dont seules les informations publiques sont visibles.
              </p>

              <hr className="my-8" />

              <h2 className="text-xl font-semibold">2. Finalité des données</h2>
              <p>Les données sont utilisées EXCLUSIVEMENT pour :</p>
              <ul>
                <li>
                  transmettre à l&apos;hôte les informations nécessaires à l&apos;accueil du
                  voyageur,
                </li>
                <li>permettre la confirmation de réservation,</li>
                <li>faciliter la communication hôte/voyageur.</li>
              </ul>
              <p>Elles ne sont jamais utilisées à d&apos;autres fins.</p>

              <hr className="my-8" />

              <h2 className="text-xl font-semibold">3. Absence de stockage</h2>
              <p>
                <strong>Nomad Nodes ne stocke aucune donnée personnelle.</strong>
              </p>
              <p>
                Les informations sont <strong>directement transmises par email</strong> à
                l&apos;hôte au moment de la réservation. Aucune base de données n&apos;en conserve
                une copie.
              </p>

              <hr className="my-8" />

              <h2 className="text-xl font-semibold">4. Cookies</h2>
              <p>
                Le Site peut utiliser des cookies <strong>strictement nécessaires</strong> au
                fonctionnement technique. Aucun cookie de suivi publicitaire n&apos;est utilisé.
              </p>

              <hr className="my-8" />

              <h2 className="text-xl font-semibold">5. Connexion wallet</h2>
              <p>Lors de la connexion Web3 :</p>
              <ul>
                <li>Nomad Nodes voit uniquement les informations publiques de l&apos;adresse,</li>
                <li>aucun fonds n&apos;est manipulé,</li>
                <li>aucune analyse blockchain n&apos;est effectuée.</li>
              </ul>

              <hr className="my-8" />

              <h2 className="text-xl font-semibold">6. Partage des données</h2>
              <p>Les données ne sont partagées :</p>
              <ul>
                <li>qu&apos;avec l&apos;hôte,</li>
                <li>uniquement au moment de la réservation,</li>
                <li>jamais avec des tiers commerciaux,</li>
                <li>jamais revendues.</li>
              </ul>
              <p>Aucun transfert hors UE n&apos;est réalisé.</p>

              <hr className="my-8" />

              <h2 className="text-xl font-semibold">7. Droits des utilisateurs</h2>
              <p>Conformément au RGPD, vous disposez de :</p>
              <ul>
                <li>droit d&apos;accès,</li>
                <li>droit de rectification,</li>
                <li>droit de suppression,</li>
                <li>droit d&apos;opposition.</li>
              </ul>
              <p>
                Vous pouvez exercer vos droits via :
                <br />
                <a href="mailto:contact@nomadnodes.com" className="text-primary hover:underline">
                  contact@nomadnodes.com
                </a>
              </p>

              <hr className="my-8" />

              <h2 className="text-xl font-semibold">8. Modifications</h2>
              <p>
                Cette Politique peut être mise à jour à tout moment. La date de mise à jour
                ci-dessus fait foi.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </VictorEasterEgg>
  );
}
