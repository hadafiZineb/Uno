// Version simplifiée pour test
class UnoTournamentOrganizer {
    constructor() {
        console.log('UnoTournamentOrganizer constructor appelé');
        this.participants = [];
        this.teams = [];
        this.tournament = null;
        this.mode = 'organizer';
        this.isReadOnly = false;
    }

    setMode(mode) {
        this.mode = mode;
        this.isReadOnly = (mode === 'participant');
        console.log(`Mode défini: ${mode}`);
    }

    generateTournament() {
        console.log('generateTournament appelé');
        // Version simplifiée
        alert('Fonction de test - generateTournament');
    }
}

console.log('script-simple.js chargé, UnoTournamentOrganizer défini');
