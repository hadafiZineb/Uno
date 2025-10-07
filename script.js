// UNO Tournament Organizer - JavaScript Logic
class UnoTournamentOrganizer {
    constructor() {
        this.participants = [];
        this.teams = [];
        this.tournament = null;
        this.mode = 'organizer'; // 'organizer' ou 'participant'
        this.isReadOnly = false;
        this.autoSaveEnabled = true;
        this.jsonFileName = 'tournament_uno_norsys.json';
        this.initializeEventListeners();
        this.updateParticipantCounter();
        this.loadFromJSON(); // Charger automatiquement au démarrage
    }

    // Définir le mode de fonctionnement
    setMode(mode) {
        this.mode = mode;
        this.isReadOnly = (mode === 'participant');
        
        if (this.isReadOnly) {
            this.enableReadOnlyMode();
        }
        
        console.log(`Mode défini: ${mode}, Lecture seule: ${this.isReadOnly}`);
    }

    // Activer le mode lecture seule
    enableReadOnlyMode() {
        // Désactiver tous les boutons d'action
        const actionButtons = document.querySelectorAll('.btn:not(#refreshTournament):not(#viewOrganizerMode)');
        actionButtons.forEach(btn => {
            if (!btn.id.includes('refresh') && !btn.id.includes('view') && !btn.id.includes('print')) {
                btn.disabled = true;
                btn.style.opacity = '0.5';
            }
        });

        // Rendre les zones de saisie en lecture seule
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            if (!input.id.includes('participant') && !input.id.includes('refresh')) {
                input.readOnly = true;
                input.style.backgroundColor = '#f8f9fa';
            }
        });

        // Désactiver les clics sur les matchs
        document.addEventListener('click', this.preventEditActions.bind(this), true);
    }

    // Empêcher les actions d'édition en mode participant
    preventEditActions(event) {
        if (this.isReadOnly) {
            const target = event.target;
            if (target.classList.contains('match-card') || 
                target.classList.contains('team-member') || 
                target.closest('.match-card') ||
                target.closest('.elimination-controls')) {
                event.preventDefault();
                event.stopPropagation();
                this.showNotification('🔒 Action non autorisée en mode participant', 'warning');
                return false;
            }
        }
    }

    // Mode participant avec synchronisation
    enableParticipantMode() {
        this.collaborationEnabled = true;
        this.startSyncLoop();
        this.loadExistingTournament();
        this.showNotification('👁️ Mode participant activé - Synchronisation en cours...', 'info');
    }

    // Charger un tournoi existant
    loadExistingTournament() {
        // Tenter de charger depuis localStorage ou serveur
        const savedData = localStorage.getItem('norsys_uno_tournament');
        if (savedData) {
            try {
                const tournamentData = JSON.parse(savedData);
                if (tournamentData.version) {
                    // Restaurer les données du tournoi
                    this.participants = tournamentData.participants || [];
                    this.teams = tournamentData.teams || [];
                    this.tournament = tournamentData.tournament;
                    this.substitutes = tournamentData.substitutes || [];

                    // Afficher le tournoi
                    if (this.tournament) {
                        this.displayTournament();
                        this.showNotification('✅ Tournoi chargé en mode participant', 'success');
                    } else {
                        this.showNotification('ℹ️ Aucun tournoi en cours - En attente...', 'info');
                    }
                } else {
                    this.showNotification('ℹ️ Aucun tournoi sauvegardé trouvé', 'info');
                }
            } catch (error) {
                console.error('Erreur lors du chargement:', error);
                this.showNotification('⚠️ Erreur lors du chargement du tournoi', 'warning');
            }
        } else {
            this.showNotification('ℹ️ Aucun tournoi en cours - En attente...', 'info');
        }
        
        // Démarrer la synchronisation périodique
        if (this.isReadOnly && !this.syncInterval) {
            this.syncInterval = setInterval(() => {
                this.syncWithServer();
            }, 3000); // Sync toutes les 3 secondes en mode participant
        }
    }

    // Synchronisation avec le serveur (simulation)
    syncWithServer() {
        // En mode réel, cela ferait appel à une API
        const savedData = localStorage.getItem('norsys_uno_tournament');
        if (savedData) {
            try {
                const tournamentData = JSON.parse(savedData);
                if (tournamentData.lastModified > this.lastSyncTime) {
                    this.handleExternalChanges(tournamentData);
                }
            } catch (error) {
                console.log('Erreur de synchronisation:', error);
            }
        }
    }

    // Sauvegarde automatique en JSON
    autoSaveToJSON() {
        if (!this.autoSaveEnabled) return;
        
        const tournamentData = {
            participants: this.participants,
            teams: this.teams,
            tournament: this.tournament,
            substitutes: this.substitutes || [],
            timestamp: new Date().toISOString(),
            lastModified: Date.now(),
            version: '2.0',
            mode: this.mode
        };

        // Sauvegarder dans localStorage
        localStorage.setItem('norsys_uno_tournament', JSON.stringify(tournamentData));
        
        // Sauvegarder aussi dans sessionStorage pour persistance
        sessionStorage.setItem('norsys_uno_backup', JSON.stringify(tournamentData));
        
        console.log('🔄 Auto-sauvegarde effectuée:', new Date().toLocaleTimeString());
        
        // Afficher un indicateur de sauvegarde
        this.showSaveIndicator();
    }

    // Indicateur visuel de sauvegarde
    showSaveIndicator() {
        const indicator = document.createElement('div');
        indicator.innerHTML = '� Sauvegardé';
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            background: var(--success-green);
            color: white;
            padding: 8px 15px;
            border-radius: 20px;
            font-size: 0.8rem;
            z-index: 1001;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        document.body.appendChild(indicator);
        
        // Animation d'apparition et disparition
        setTimeout(() => indicator.style.opacity = '1', 10);
        setTimeout(() => {
            indicator.style.opacity = '0';
            setTimeout(() => indicator.remove(), 300);
        }, 1500);
    }

    // Charger depuis JSON
    loadFromJSON() {
        const savedData = localStorage.getItem('norsys_uno_tournament');
        if (savedData) {
            try {
                const tournamentData = JSON.parse(savedData);
                if (tournamentData.version) {
                    this.participants = tournamentData.participants || [];
                    this.teams = tournamentData.teams || [];
                    this.tournament = tournamentData.tournament;
                    this.substitutes = tournamentData.substitutes || [];

                    // Mettre à jour l'interface si des données existent
                    if (this.participants.length > 0) {
                        document.getElementById('participantInput').value = this.participants.join('\n');
                        this.updateParticipantCounter();
                    }

                    if (this.tournament) {
                        this.displayTournament();
                        this.showNotification('✅ Tournoi restauré automatiquement', 'success');
                    }
                }
            } catch (error) {
                console.error('Erreur lors du chargement:', error);
            }
        }
    }

    // Télécharger un fichier JSON
    downloadJSON(data, filename) {
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        // Création d'un lien de téléchargement invisible
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(link.href);
    }

    initializeEventListeners() {
        // Éléments obligatoires
        const participantInput = document.getElementById('participantInput');
        const generateBtn = document.getElementById('generateTournament');
        const clearBtn = document.getElementById('clearInput');
        const loadTournamentBtn = document.getElementById('loadTournament');
        const importTournamentBtn = document.getElementById('importTournament');
        const fileInput = document.getElementById('fileInput');

        // Éléments optionnels
        const printBtn = document.getElementById('printTournament');
        const newTournamentBtn = document.getElementById('newTournament');
        const saveTournamentBtn = document.getElementById('saveTournament');
        const exportTournamentBtn = document.getElementById('exportTournament');
        const showNetworkBtn = document.getElementById('showNetworkInstructions');
        const enableCollabBtn = document.getElementById('enableCollaboration');
        const userNameInput = document.getElementById('userName');
        const exportPowerPointBtn = document.getElementById('exportPowerPointBtn');

        // Event listeners pour les éléments obligatoires
        if (participantInput) participantInput.addEventListener('input', () => this.updateParticipantCounter());
        if (generateBtn) generateBtn.addEventListener('click', () => this.generateTournament());
        if (clearBtn) clearBtn.addEventListener('click', () => this.clearInput());
        if (loadTournamentBtn) loadTournamentBtn.addEventListener('click', () => this.loadTournament());
        if (importTournamentBtn) importTournamentBtn.addEventListener('click', () => this.importTournament());
        if (fileInput) fileInput.addEventListener('change', (e) => this.handleFileImport(e));

        // Event listeners pour les éléments optionnels
        if (printBtn) printBtn.addEventListener('click', () => this.printTournament());
        if (newTournamentBtn) newTournamentBtn.addEventListener('click', () => this.newTournament());
        if (saveTournamentBtn) saveTournamentBtn.addEventListener('click', () => this.saveTournament());
        if (exportTournamentBtn) exportTournamentBtn.addEventListener('click', () => this.exportTournament());
        if (exportPowerPointBtn) exportPowerPointBtn.addEventListener('click', () => this.exportPowerPoint());
        if (showNetworkBtn) showNetworkBtn.addEventListener('click', () => this.showNetworkInstructions());
        if (enableCollabBtn) enableCollabBtn.addEventListener('click', () => this.enableCollaboration());

        // Collaboration setup
        this.collaborationEnabled = false;
        this.userName = '';
        this.lastSyncTime = 0;
        this.syncInterval = null;

        // Check for saved tournament on startup
        this.checkForSavedTournament();
    }

    updateParticipantCounter() {
        const input = document.getElementById('participantInput').value.trim();
        const participants = this.parseParticipants(input);
        const count = participants.length;
        const counter = document.getElementById('participantCounter');
        
        counter.textContent = `${count} participant${count !== 1 ? 's' : ''}`;
        
        if (count > 0 && count < 4) {
            counter.style.color = '#e74c3c';
            counter.textContent += ' (minimum 4 requis)';
        } else if (count >= 4) {
            counter.style.color = '#27ae60';
            const teams = Math.floor(count / 4);
            const remaining = count % 4;
            counter.textContent += ` → ${teams} équipe${teams !== 1 ? 's' : ''} de 4`;
            if (remaining > 0) {
                counter.textContent += ` + ${remaining} remplaçant${remaining !== 1 ? 's' : ''}`;
            }
        } else {
            counter.style.color = '#7f8c8d';
        }
    }

    parseParticipants(input) {
        if (!input) return [];
        
        // Split by new lines or commas, then clean up
        return input
            .split(/[,\n]/)
            .map(name => name.trim())
            .filter(name => name.length > 0)
            .filter((name, index, arr) => arr.indexOf(name) === index); // Remove duplicates
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    createTeams(participants) {
        const shuffled = this.shuffleArray(participants);
        const teams = [];

        for (let i = 0; i < shuffled.length; i += 4) {
            const teamMembers = shuffled.slice(i, i + 4);
            if (teamMembers.length === 4) {
                teams.push({
                    name: `Équipe ${teams.length + 1}`,
                    members: teamMembers,
                    id: teams.length + 1
                });
            }
        }

        // Handle remaining participants
        const remaining = shuffled.slice(teams.length * 4);
        if (remaining.length > 0) {
            this.substitutes = remaining;
        }

        return teams;
    }

    createTournamentStructure(teams) {
        if (teams.length < 1) return null;

        // Phase 1: Internal team matches (each team of 4 plays internally)
        const teamMatches = teams.map((team, index) => ({
            teamId: team.id,
            teamName: team.name,
            teamColor: this.getTeamColor(index),
            members: team.members,
            internalMatches: this.createInternalMatches(team.members, team.id),
            winner: null,
            completed: false
        }));

        // Phase 2: Winners tournament (will be created after phase 1)
        const winnersTournament = null;

        return {
            phase1: teamMatches,
            phase2: winnersTournament,
            currentPhase: 1
        };
    }

    createInternalMatches(members, teamId) {
        const eliminationRounds = [];
        let currentPlayers = [...members];
        let roundNumber = 1;

        // Create elimination rounds until only 1 player remains
        while (currentPlayers.length > 1) {
            const playersToEliminate = 1;
            
            eliminationRounds.push({
                round: roundNumber,
                roundName: this.getEliminationRoundName(roundNumber, currentPlayers.length),
                players: [...currentPlayers],
                eliminated: null,
                completed: false,
                id: `team${teamId}_elimination_r${roundNumber}`
            });

            roundNumber++;
            // Remove one player for next round (will be set when elimination happens)
            currentPlayers = currentPlayers.slice(0, currentPlayers.length - 1);
        }

        return eliminationRounds;
    }

    getEliminationRoundName(roundNumber, remainingPlayers) {
        switch (remainingPlayers) {
            case 4: return '🎮 1ère Élimination (4→3)';
            case 3: return '⚔️ 2ème Élimination (3→2)';
            case 2: return '🏆 Finale Équipe (2→1)';
            default: return `🎮 Élimination Round ${roundNumber}`;
        }
    }

    getTeamColor(index) {
        const colors = ['var(--norsys-primary)', 'var(--norsys-secondary)', 'var(--norsys-accent)', 'var(--success-green)'];
        return colors[index % colors.length];
    }

    createWinnersTournament(teamWinners) {
        if (teamWinners.length < 2) return null;

        const brackets = [];
        let currentRound = [...teamWinners];
        let roundNumber = 1;

        while (currentRound.length > 1) {
            const nextRound = [];
            const matches = [];

            for (let i = 0; i < currentRound.length; i += 2) {
                if (i + 1 < currentRound.length) {
                    matches.push({
                        id: `final_r${roundNumber}m${matches.length + 1}`,
                        player1: currentRound[i],
                        player2: currentRound[i + 1],
                        winner: null,
                        completed: false,
                        round: roundNumber
                    });
                    nextRound.push({ name: `Vainqueur Match ${matches.length}`, isPlaceholder: true });
                } else {
                    // Odd player gets a bye
                    nextRound.push(currentRound[i]);
                }
            }

            brackets.push({
                round: roundNumber,
                roundName: this.getFinalRoundName(roundNumber, teamWinners.length),
                matches: matches,
                completed: false
            });

            currentRound = nextRound;
            roundNumber++;
        }

        return brackets;
    }

    getFinalRoundName(roundNumber, totalWinners) {
        const rounds = Math.ceil(Math.log2(totalWinners));
        const remainingRounds = rounds - roundNumber + 1;

        switch (remainingRounds) {
            case 1: return '🏆 GRANDE FINALE';
            case 2: return '🥉 DEMI-FINALES';
            case 3: return '⚔️ QUARTS DE FINALE';
            default: return `🎮 ROUND ${roundNumber}`;
        }
    }

    getRoundName(roundNumber, totalTeams) {
        const rounds = Math.ceil(Math.log2(totalTeams));
        const remainingRounds = rounds - roundNumber + 1;

        switch (remainingRounds) {
            case 1: return '🏆 FINALE';
            case 2: return '🥉 DEMI-FINALES';
            case 3: return '⚔️ QUARTS DE FINALE';
            case 4: return '🎯 HUITIÈMES DE FINALE';
            default: return `🎮 ROUND ${roundNumber}`;
        }
    }

    generateTournament() {
        const input = document.getElementById('participantInput').value.trim();
        const participants = this.parseParticipants(input);

        if (participants.length < 4) {
            alert('⚠️ Il faut au moins 4 participants pour créer un tournoi !');
            return;
        }

        this.participants = participants;
        this.teams = this.createTeams(participants);
        this.tournament = this.createTournamentStructure(this.teams);

        this.displayTournament();
        
        // Auto-save the new tournament
        this.autoSaveEnabled = true;
        this.autoSave();
        
        // Sauvegarder explicitement pour le schéma
        this.saveForSchema();
    }

    displayTournament() {
        const resultsSection = document.getElementById('resultsSection');
        const teamsContainer = document.getElementById('teamsContainer');
        const bracketsContainer = document.getElementById('bracketsContainer');

        // Show results section
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth' });

        // Display tournament info
        const totalParticipants = this.participants.length;
        const activeTeams = this.teams.length;
        const substitutes = this.substitutes ? this.substitutes.length : 0;

        

        // Mettre à jour le statut dans la navbar
        this.updateTournamentStatus();

        // Display teams
        this.displayTeams(teamsContainer);

        // Display tournament phases
        if (this.tournament) {
            this.displayTournamentPhases();
        }

        // Display substitutes if any
        if (this.substitutes && this.substitutes.length > 0) {
            this.displaySubstitutes(teamsContainer);
        }
    }

    // Mettre à jour le statut du tournoi dans l'en-tête
    updateTournamentStatus() {
        const statusElement = document.getElementById('tournamentStatusInfo');
        if (!statusElement) return;

        const totalParticipants = this.participants.length;
        const activeTeams = this.teams.length;
        const completedMatches = this.tournament && this.tournament.phase1 ? 
            this.tournament.phase1.filter(team => team.completed).length : 0;

        statusElement.innerHTML = `
            <div style="display: flex; justify-content: center; gap: 30px; flex-wrap: wrap;">
                <div class="status-item">
                    <span class="status-number">${totalParticipants}</span>
                    <span class="status-label">Participants</span>
                </div>
                <div class="status-item">
                    <span class="status-number">${activeTeams}</span>
                    <span class="status-label">Équipes</span>
                </div>
                <div class="status-item">
                    <span class="status-number">${completedMatches}/${activeTeams}</span>
                    <span class="status-label">Matchs Terminés</span>
                </div>
            </div>
        `;
    }

    displayTeams(container) {
        // Masquer l'ancien conteneur scroll et afficher la navigation
        container.style.display = 'none';
        
        // Mettre à jour la sidebar avec les équipes
        if (typeof updateSidebarContent === 'function') {
            updateSidebarContent();
        }
        
        // Initialiser et afficher la navigation des équipes
        if (typeof initializeTeamNavigation === 'function') {
            initializeTeamNavigation();
        }
    }

    displaySubstitutes(container) {
        if (!this.substitutes || this.substitutes.length === 0) return;

        const substitutesCard = document.createElement('div');
        substitutesCard.className = 'team-card';
        substitutesCard.style.borderLeftColor = '#95a5a6';
        substitutesCard.innerHTML = `
            <div class="team-name">🔄 Remplaçants</div>
            <ul class="team-members">
                ${this.substitutes.map(member => `<li>${member}</li>`).join('')}
            </ul>
        `;
        container.appendChild(substitutesCard);
    }

    displayTournamentPhases() {
        const phaseContainer = document.getElementById('phaseContainer');
        
        if (this.tournament.currentPhase === 1) {
            // Afficher la navigation des équipes pour la Phase 1
            const teamsNavigation = document.getElementById('teamsNavigation');
            if (teamsNavigation) {
                teamsNavigation.style.display = 'block';
            }
            
            // Initialiser la navigation si elle n'est pas encore active
            if (typeof initializeTeamNavigation === 'function') {
                initializeTeamNavigation();
            }
            
            // Masquer l'ancien affichage des matchs
            this.displayTeamMatches();
        } else if (this.tournament.currentPhase === 2) {
            // Masquer la navigation et afficher le tournoi des vainqueurs
            const teamsNavigation = document.getElementById('teamsNavigation');
            if (teamsNavigation) {
                teamsNavigation.style.display = 'none';
            }
            this.displayWinnersTournament();
        }
    }

    displayTeamMatches() {
        const container = document.getElementById('teamMatchesContainer');
        container.innerHTML = `
            <h3 style="text-align: center; margin-bottom: 30px; color: var(--norsys-dark);">
                � PHASE 1: Matchs Internes des Équipes
            </h3>
            <p style="text-align: center; margin-bottom: 30px; color: var(--norsys-dark); font-style: italic;">
                Chaque équipe de 4 joue en interne pour déterminer son représentant
            </p>
        `;

        this.tournament.phase1.forEach((teamData, index) => {
            const teamDiv = document.createElement('div');
            teamDiv.className = 'team-tournament-section';
            teamDiv.style.marginBottom = '40px';
            teamDiv.style.padding = '25px';
            teamDiv.style.background = 'var(--norsys-white)';
            teamDiv.style.borderRadius = '20px';
            teamDiv.style.boxShadow = 'var(--shadow)';
            teamDiv.style.borderLeft = `5px solid ${teamData.teamColor}`;

            const headerHtml = `
                <div style="text-align: center; margin-bottom: 25px;">
                    <h4 style="color: var(--norsys-dark); font-size: 1.4rem; margin-bottom: 10px;">
                        ${teamData.teamName}
                    </h4>
                    <div style="display: flex; justify-content: center; gap: 15px; flex-wrap: wrap;">
                        ${teamData.members.map(member => 
                            `<span style="background: ${teamData.teamColor}; color: white; padding: 5px 12px; border-radius: 15px; font-size: 0.9rem;">
                                ${member}
                            </span>`
                        ).join('')}
                    </div>
                    ${teamData.completed ? 
                        `<div style="margin-top: 15px; color: var(--success-green); font-weight: 600;">
                            🏆 Vainqueur: ${teamData.winner}
                        </div>` : 
                        '<div style="margin-top: 15px; color: var(--warning-orange); font-weight: 600;">⏳ En cours...</div>'
                    }
                </div>
            `;

            const eliminationHtml = teamData.internalMatches.map(round => {
                const playersHtml = round.players.map(player => `
                    <div class="player-card ${round.eliminated === player ? 'eliminated' : ''} ${round.completed && round.eliminated !== player ? 'survivor' : ''}" 
                         onclick="eliminatePlayer('${round.id}', '${player}')"
                         style="cursor: ${round.completed ? 'default' : 'pointer'};">
                        <span class="player-name">${player}</span>
                        ${round.eliminated === player ? '<span class="elimination-mark">❌ Éliminé</span>' : ''}
                        ${round.completed && round.eliminated !== player ? '<span class="survivor-mark">✅ Qualifié</span>' : ''}
                    </div>
                `).join('');

                return `
                    <div class="elimination-round" style="margin-bottom: 25px;">
                        <div class="bracket-title" style="font-size: 1.1rem; padding: 10px;">
                            ${round.roundName}
                        </div>
                        <div class="players-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 15px;">
                            ${playersHtml}
                        </div>
                        ${round.completed ? 
                            `<div class="elimination-result" style="text-align: center; color: var(--error-red); font-weight: 600;">
                                🚫 ${round.eliminated} a été éliminé(e)
                            </div>` : 
                            `<div class="elimination-controls" style="text-align: center;">
                                <p style="margin-bottom: 10px; color: var(--norsys-dark); font-style: italic;">
                                    Cliquez sur le joueur à éliminer
                                </p>
                                <button class="btn btn-success" onclick="confirmElimination('${round.id}')" 
                                        ${!round.eliminated ? 'disabled' : ''}>
                                    ✅ Confirmer l'élimination
                                </button>
                            </div>`
                        }
                    </div>
                `;
            }).join('');

            teamDiv.innerHTML = headerHtml + eliminationHtml;
            container.appendChild(teamDiv);
        });

        // Add phase control
        this.addPhaseControls(container);
    }

    displayWinnersTournament() {
        const container = document.getElementById('winnersTournamentContainer');
        container.style.display = 'block';
        
        container.innerHTML = `
            <h3 style="text-align: center; margin-bottom: 30px; color: var(--norsys-dark);">
                🏆 PHASE 2: Tournoi des Vainqueurs
            </h3>
            <p style="text-align: center; margin-bottom: 30px; color: var(--norsys-dark); font-style: italic;">
                Les vainqueurs de chaque équipe s'affrontent pour le titre de champion !
            </p>
        `;

        if (this.tournament.phase2) {
            this.tournament.phase2.forEach(round => {
                const roundDiv = document.createElement('div');
                roundDiv.className = 'bracket-round';
                
                const matchesHtml = round.matches.map((match) => {
                    const player1Name = match.player1.name || match.player1;
                    const player2Name = match.player2.name || match.player2;
                    
                    return `
                        <div class="match-card ${match.completed ? 'match-completed' : ''}" data-match-id="${match.id}">
                            <div class="match-teams">
                                <span class="match-team ${match.winner === 'player1' ? 'winner' : ''}" 
                                      onclick="selectFinalWinner('${match.id}', 'player1')">
                                    ${player1Name}
                                </span>
                                <span class="vs">VS</span>
                                <span class="match-team ${match.winner === 'player2' ? 'winner' : ''}" 
                                      onclick="selectFinalWinner('${match.id}', 'player2')">
                                    ${player2Name}
                                </span>
                            </div>
                            ${match.completed ? 
                                `<div class="match-winner-display">
                                    🏆 Vainqueur: ${match.winner === 'player1' ? player1Name : player2Name}
                                </div>` : 
                                `<div class="match-controls">
                                    <button class="btn btn-success" onclick="confirmFinalMatch('${match.id}')">
                                        ✅ Confirmer le match
                                    </button>
                                </div>`
                            }
                        </div>
                    `;
                }).join('');
                
                roundDiv.innerHTML = `
                    <div class="bracket-title">${round.roundName}</div>
                    <div class="bracket-matches">
                        ${matchesHtml}
                    </div>
                `;
                
                container.appendChild(roundDiv);
            });
        }
    }

    clearInput() {
        if (this.tournament && !confirm('⚠️ Voulez-vous vraiment effacer ? Le tournoi en cours sera perdu !')) {
            return;
        }
        
        document.getElementById('participantInput').value = '';
        this.updateParticipantCounter();
        document.getElementById('resultsSection').style.display = 'none';
        
        // Clear tournament data
        this.participants = [];
        this.teams = [];
        this.tournament = null;
        this.substitutes = [];
        
        // Clear saved data
        this.clearSavedTournament();
    }

    newTournament() {
        if (this.tournament && confirm('⚠️ Voulez-vous vraiment créer un nouveau tournoi ? La sauvegarde actuelle sera supprimée.')) {
            this.clearSavedTournament();
        }
        this.clearInput();
        document.getElementById('participantInput').focus();
    }

    printTournament() {
        window.print();
    }

    selectPlayerToEliminate(roundId, player) {
        // Vérifier les permissions
        if (!this.checkPermissions('Sélectionner Joueur à Éliminer')) {
            return;
        }

        const round = this.findEliminationRound(roundId);
        if (!round || round.completed) {
            this.showNotification('⚠️ Ce round est déjà terminé', 'warning');
            return;
        }

        round.eliminated = player;
        this.displayTeamMatches();
        
        // Mettre à jour la sidebar si elle existe
        if (typeof updateSidebarContent === 'function') {
            updateSidebarContent();
        }
        
        this.showNotification(`👤 ${player} sélectionné pour élimination`, 'info');
    }

    confirmElimination(roundId) {
        // Vérifier les permissions
        if (!this.checkPermissions('Confirmer Élimination')) {
            return;
        }

        const round = this.findEliminationRound(roundId);
        if (!round || !round.eliminated) {
            alert('⚠️ Veuillez d\'abord sélectionner le joueur à éliminer !');
            return;
        }

        round.completed = true;
        this.processElimination(round);
        this.displayTeamMatches();
        this.checkPhase1Completion();
        this.autoSaveToJSON(); // Auto-save after each elimination
        this.saveForSchema(); // Sauvegarder pour le schéma
        
        // Mettre à jour la sidebar si elle existe
        if (typeof updateSidebarContent === 'function') {
            updateSidebarContent();
        }
        
        // Mettre à jour le statut du tournoi
        this.updateTournamentStatus();
        
        this.showNotification(`✅ Élimination confirmée: ${round.eliminated}`, 'success');
    }

    selectFinalWinner(matchId, winner) {
        const match = this.findFinalMatch(matchId);
        if (!match || match.completed) return;

        match.winner = winner;
        this.updateMatchDisplay(matchId);
    }

    confirmFinalMatch(matchId) {
        const match = this.findFinalMatch(matchId);
        if (!match || !match.winner) {
            alert('⚠️ Veuillez d\'abord sélectionner le vainqueur du match !');
            return;
        }

        match.completed = true;
        this.advanceFinalWinner(match);
        this.displayWinnersTournament();
        this.checkFinalTournamentCompletion();
        this.autoSave(); // Auto-save after each final match
    }

    findEliminationRound(roundId) {
        for (let teamData of this.tournament.phase1) {
            for (let round of teamData.internalMatches) {
                if (round.id === roundId) {
                    return round;
                }
            }
        }
        return null;
    }

    findFinalMatch(matchId) {
        if (!this.tournament.phase2) return null;
        
        for (let round of this.tournament.phase2) {
            for (let match of round.matches) {
                if (match.id === matchId) {
                    return match;
                }
            }
        }
        return null;
    }

    updateMatchDisplay(matchId) {
        const matchCard = document.querySelector(`[data-match-id="${matchId}"]`);
        if (!matchCard) return;

        const match = this.findMatch(matchId);
        const teams = matchCard.querySelectorAll('.match-team');
        
        teams.forEach((team, index) => {
            team.classList.remove('winner');
            if ((index === 0 && match.winner === 'team1') || 
                (index === 1 && match.winner === 'team2')) {
                team.classList.add('winner');
            }
        });
    }

    processElimination(completedRound) {
        const teamData = this.getTeamDataFromRound(completedRound.id);
        
        // Remove eliminated player from next rounds
        const remainingPlayers = completedRound.players.filter(player => player !== completedRound.eliminated);
        
        // Update next round with remaining players
        const nextRoundIndex = completedRound.round;
        const nextRound = teamData.internalMatches[nextRoundIndex];
        
        if (nextRound) {
            nextRound.players = remainingPlayers;
        } else {
            // This was the final elimination - set team winner
            if (remainingPlayers.length === 1) {
                teamData.winner = remainingPlayers[0];
                teamData.completed = true;
            }
        }
    }

    getTeamDataFromRound(roundId) {
        for (let teamData of this.tournament.phase1) {
            for (let round of teamData.internalMatches) {
                if (round.id === roundId) {
                    return teamData;
                }
            }
        }
        return null;
    }

    advanceFinalWinner(completedMatch) {
        const winnerName = completedMatch.winner === 'player1' ? completedMatch.player1 : completedMatch.player2;
        const currentRound = completedMatch.round;
        
        // Find next round
        const nextRound = this.tournament.phase2.find(round => round.round === currentRound + 1);
        if (!nextRound) return; // This was the final

        // Find the match in next round that needs this winner
        const currentRoundData = this.tournament.phase2.find(round => round.round === currentRound);
        const matchIndex = Math.floor(currentRoundData.matches.indexOf(completedMatch) / 2);
        const nextMatch = nextRound.matches[matchIndex];
        
        if (nextMatch) {
            const positionInRound = currentRoundData.matches.indexOf(completedMatch);
            if (positionInRound % 2 === 0) {
                nextMatch.player1 = winnerName;
            } else {
                nextMatch.player2 = winnerName;
            }
        }
    }



    checkPhase1Completion() {
        const allTeamsCompleted = this.tournament.phase1.every(team => team.completed);
        
        if (allTeamsCompleted) {
            // Create phase 2 with team winners
            const teamWinners = this.tournament.phase1.map(team => team.winner);
            this.tournament.phase2 = this.createWinnersTournament(teamWinners);
            this.tournament.currentPhase = 2;
            
            // Show transition message
            this.showPhaseTransition();
        }
    }

    checkFinalTournamentCompletion() {
        if (!this.tournament.phase2) return;
        
        const finalRound = this.tournament.phase2[this.tournament.phase2.length - 1];
        const finalMatch = finalRound.matches[0];
        
        if (finalMatch && finalMatch.completed) {
            const championName = finalMatch.winner === 'player1' ? finalMatch.player1 : finalMatch.player2;
            const championTeam = this.findOriginalTeam(championName);
            this.displayFinalChampion(championName, championTeam);
        }
    }

    findOriginalTeam(playerName) {
        for (let team of this.teams) {
            if (team.members.includes(playerName)) {
                return team;
            }
        }
        return null;
    }

    displayFinalChampion(championName, championTeam) {
        const container = document.getElementById('winnersTournamentContainer');
        const championDiv = document.createElement('div');
        championDiv.className = 'champion-announcement';
        championDiv.innerHTML = `
            <div style="background: var(--gradient-primary); color: white; padding: 30px; border-radius: 20px; text-align: center; margin: 30px 0; animation: pulse 2s infinite;">
                <h2 style="font-size: 2.5rem; margin-bottom: 15px;">🏆 CHAMPION DU TOURNOI UNO ! 🏆</h2>
                <h3 style="font-size: 2rem; color: #f1c40f;">${championName}</h3>
                <p style="margin-top: 15px; font-size: 1.2rem;">Vainqueur de l'équipe : <strong>${championTeam ? championTeam.name : 'Équipe inconnue'}</strong></p>
                ${championTeam ? `
                    <div style="margin-top: 20px; font-size: 1rem;">
                        <p>Membres de l'équipe d'origine :</p>
                        <div style="display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; margin-top: 10px;">
                            ${championTeam.members.map(member => 
                                `<span style="background: ${member === championName ? 'var(--warning-orange)' : 'rgba(255,255,255,0.2)'}; 
                                               padding: 5px 12px; border-radius: 15px; font-size: 0.9rem;">
                                    ${member === championName ? '👑 ' + member : member}
                                </span>`
                            ).join('')}
                        </div>
                    </div>
                ` : ''}
                <p style="margin-top: 20px; font-size: 1.1rem;">🎉 Félicitations Campus Norsys Agadir ! 🎉</p>
            </div>
        `;
        container.appendChild(championDiv);
    }

    showPhaseTransition() {
        const container = document.getElementById('teamMatchesContainer');
        const transitionDiv = document.createElement('div');
        transitionDiv.innerHTML = `
            <div style="background: var(--gradient-secondary); color: white; padding: 25px; border-radius: 20px; text-align: center; margin: 30px 0;">
                <h3 style="font-size: 1.8rem; margin-bottom: 15px;">� PHASE 1 TERMINÉE ! 🎉</h3>
                <p style="font-size: 1.2rem; margin-bottom: 20px;">
                    Tous les vainqueurs d'équipes sont déterminés !
                </p>
                <div style="margin: 20px 0;">
                    ${this.tournament.phase1.map(team => 
                        `<div style="margin: 8px 0;">
                            <strong>${team.teamName}:</strong> 🏆 ${team.winner}
                        </div>`
                    ).join('')}
                </div>
                <button class="btn btn-accent" onclick="startPhase2()" style="margin-top: 15px; font-size: 1.1rem;">
                    🚀 Commencer la Phase 2 - Tournoi des Vainqueurs
                </button>
            </div>
        `;
        container.appendChild(transitionDiv);
    }

    startPhase2() {
        document.getElementById('teamMatchesContainer').style.display = 'none';
        this.displayWinnersTournament();
    }

    addPhaseControls(container) {
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'tournament-controls';
        controlsDiv.innerHTML = `
            <div style="text-align: center; margin: 30px 0; padding: 20px; background: var(--norsys-light); border-radius: 15px;">
                <h4 style="color: var(--norsys-dark); margin-bottom: 15px;">🎮 Instructions</h4>
                <p style="color: var(--norsys-dark); margin-bottom: 15px;">
                    Chaque équipe de 4 joue en interne. Cliquez sur un joueur pour le sélectionner comme vainqueur, puis confirmez le match.
                </p>
                <p style="color: var(--norsys-dark); margin-bottom: 15px;">
                    Une fois tous les vainqueurs d'équipes déterminés, la Phase 2 commencera automatiquement !
                </p>
                <button class="btn btn-secondary" onclick="resetTournament()">
                    🔄 Recommencer le tournoi
                </button>
            </div>
        `;
        container.appendChild(controlsDiv);
    }

    resetTournament() {
        if (confirm('⚠️ Êtes-vous sûr de vouloir recommencer le tournoi ? Tous les résultats seront perdus.')) {
            // Reset phase 1
            this.tournament.phase1.forEach(teamData => {
                teamData.winner = null;
                teamData.completed = false;
                teamData.internalMatches.forEach(round => {
                    round.matches.forEach(match => {
                        match.winner = null;
                        match.completed = false;
                        // Reset to original players
                        const originalMembers = teamData.members;
                        if (match.player1.includes('Vainqueur')) {
                            // Reset advanced players back to original
                            this.resetInternalMatchesToOriginal(teamData);
                        }
                    });
                });
            });

            // Reset phase 2
            this.tournament.phase2 = null;
            this.tournament.currentPhase = 1;

            // Hide phase 2 and show phase 1
            document.getElementById('winnersTournamentContainer').style.display = 'none';
            document.getElementById('teamMatchesContainer').style.display = 'block';

            // Redisplay
            this.displayTournamentPhases();
        }
    }

    resetInternalMatchesToOriginal(teamData) {
        // Recreate internal matches from scratch
        teamData.internalMatches = this.createInternalMatches(teamData.members, teamData.teamId);
    }

    // Sauvegarde et chargement du tournoi
    saveTournament() {
        if (!this.tournament) {
            alert('⚠️ Aucun tournoi à sauvegarder !');
            return;
        }

        const tournamentData = {
            participants: this.participants,
            teams: this.teams,
            tournament: this.tournament,
            substitutes: this.substitutes,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };

        try {
            localStorage.setItem('norsys_uno_tournament', JSON.stringify(tournamentData));
            this.showNotification('✅ Tournoi sauvegardé avec succès !', 'success');
            this.autoSaveEnabled = true;
        } catch (error) {
            this.showNotification('❌ Erreur lors de la sauvegarde', 'error');
            console.error('Erreur sauvegarde:', error);
        }
    }

    loadTournament() {
        try {
            const savedData = localStorage.getItem('norsys_uno_tournament');
            if (!savedData) {
                alert('⚠️ Aucun tournoi sauvegardé trouvé !');
                return;
            }

            const tournamentData = JSON.parse(savedData);
            
            // Restore tournament data
            this.participants = tournamentData.participants;
            this.teams = tournamentData.teams;
            this.tournament = tournamentData.tournament;
            this.substitutes = tournamentData.substitutes;

            // Update UI
            document.getElementById('participantInput').value = this.participants.join('\n');
            this.updateParticipantCounter();
            this.displayTournament();

            this.showNotification('✅ Tournoi chargé avec succès !', 'success');
            this.autoSaveEnabled = true;

            // Hide load button, show save button
            document.getElementById('loadTournament').style.display = 'none';

        } catch (error) {
            this.showNotification('❌ Erreur lors du chargement', 'error');
            console.error('Erreur chargement:', error);
        }
    }

    checkForSavedTournament() {
        const savedData = localStorage.getItem('norsys_uno_tournament');
        if (savedData) {
            try {
                const tournamentData = JSON.parse(savedData);
                if (tournamentData.version) {
                    // Auto-restore the tournament
                    this.participants = tournamentData.participants;
                    this.teams = tournamentData.teams;
                    this.tournament = tournamentData.tournament;
                    this.substitutes = tournamentData.substitutes;

                    // Update UI
                    document.getElementById('participantInput').value = this.participants.join('\n');
                    this.updateParticipantCounter();
                    this.displayTournament();

                    this.autoSaveEnabled = true;

                    // Show notification
                    const timestamp = new Date(tournamentData.timestamp).toLocaleString('fr-FR');
                    this.showNotification(`✅ Tournoi restauré automatiquement (${timestamp})`, 'success');
                    
                    // Hide the load button since we auto-loaded
                    document.getElementById('loadTournament').style.display = 'none';
                }
            } catch (error) {
                console.error('Erreur lecture sauvegarde:', error);
                // Show load button as fallback
                const loadBtn = document.getElementById('loadTournament');
                loadBtn.style.display = 'inline-block';
            }
        }
    }

    autoSave() {
        // Rediriger vers la nouvelle méthode JSON
        this.autoSaveToJSON();
    }

    saveForSchema() {
        const schemaData = {
            participants: this.participants,
            teams: this.teams,
            tournament: this.tournament,
            substitutes: this.substitutes,
            timestamp: new Date().toISOString()
        };
        
        // Sauvegarder avec la clé que le schéma recherche
        localStorage.setItem('norsys_uno_tournament', JSON.stringify(schemaData));
        console.log('✅ Données sauvegardées pour le schéma:', schemaData);
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    // Vérifier les permissions avant une action
    checkPermissions(action) {
        if (this.isReadOnly) {
            this.showNotification(`🔒 Action "${action}" non autorisée en mode participant`, 'warning');
            return false;
        }
        return true;
    }

    clearSavedTournament() {
        localStorage.removeItem('norsys_uno_tournament');
        this.autoSaveEnabled = false;
        document.getElementById('loadTournament').style.display = 'none';
        console.log('Sauvegarde supprimée');
    }

    // Export/Import pour partage
    exportTournament() {
        if (!this.tournament) {
            alert('⚠️ Aucun tournoi à exporter !');
            return;
        }

        const tournamentData = {
            participants: this.participants,
            teams: this.teams,
            tournament: this.tournament,
            substitutes: this.substitutes,
            timestamp: new Date().toISOString(),
            version: '1.0',
            exportedBy: 'Norsys UNO Tournament Organizer'
        };

        const dataStr = JSON.stringify(tournamentData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `tournoi-uno-norsys-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        this.showNotification('📤 Tournoi exporté avec succès !', 'success');
    }

    importTournament() {
        document.getElementById('fileInput').click();
    }

    handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const tournamentData = JSON.parse(e.target.result);
                
                // Validation basique
                if (!tournamentData.version || !tournamentData.participants || !tournamentData.tournament) {
                    throw new Error('Fichier de tournoi invalide');
                }

                // Restore tournament data
                this.participants = tournamentData.participants;
                this.teams = tournamentData.teams;
                this.tournament = tournamentData.tournament;
                this.substitutes = tournamentData.substitutes || [];

                // Update UI
                document.getElementById('participantInput').value = this.participants.join('\n');
                this.updateParticipantCounter();
                this.displayTournament();

                this.autoSaveEnabled = true;
                this.autoSave(); // Save to local storage too

                const timestamp = new Date(tournamentData.timestamp).toLocaleString('fr-FR');
                this.showNotification(`📥 Tournoi importé avec succès ! (${timestamp})`, 'success');

            } catch (error) {
                this.showNotification('❌ Erreur lors de l\'importation du fichier', 'error');
                console.error('Erreur import:', error);
            }
        };
        reader.readAsText(file);
        
        // Reset file input
        event.target.value = '';
    }

    showNetworkInstructions() {
        const modal = document.createElement('div');
        modal.className = 'network-modal';
        modal.innerHTML = `
            <div class="network-modal-content">
                <div class="network-modal-header">
                    <h2>🌐 Instructions pour Partage Réseau</h2>
                    <button class="network-modal-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
                </div>
                <div class="network-modal-body">
                    <h3>📡 Serveur pour Collaboration Multi-Utilisateurs</h3>
                    <div class="instruction-step">
                        <p><strong>1. Ouvrir un terminal/invite de commande dans le dossier du tournoi</strong></p>
                        <code>cd d:\\Tournois</code>
                    </div>
                    <div class="instruction-step">
                        <p><strong>2. Démarrer un serveur web simple:</strong></p>
                        <code>python -m http.server 8000</code>
                        <p style="font-size: 0.9rem; color: #666;">Ou avec Node.js: <code>npx http-server -p 8000</code></p>
                    </div>
                    <div class="instruction-step">
                        <p><strong>3. Trouver votre adresse IP:</strong></p>
                        <code>ipconfig</code> (Windows) ou <code>ifconfig</code> (Mac/Linux)
                        <p style="font-size: 0.9rem; color: #666;">Cherchez "IPv4" ou "inet" (ex: 192.168.1.100)</p>
                    </div>
                    <div class="instruction-step">
                        <p><strong>4. Partager l'adresse avec vos collaborateurs:</strong></p>
                        <code>http://[VOTRE_IP]:8000</code>
                        <p style="font-size: 0.9rem; color: #666;">Exemple: http://192.168.1.100:8000</p>
                    </div>
                    <div class="instruction-step">
                        <p><strong>5. Chaque collaborateur:</strong></p>
                        <p>• Ouvre l'URL dans son navigateur</p>
                        <p>• Entre son nom et active la collaboration</p>
                        <p>• Peut maintenant modifier le tournoi en temps réel !</p>
                    </div>

                    <h3>📱 Option 2: Partage de Fichier</h3>
                    <div class="instruction-step">
                        <p><strong>1. Exporter le tournoi</strong> (bouton "📤 Exporter")</p>
                        <p><strong>2. Partager le fichier .json</strong> via email/chat/clé USB</p>
                        <p><strong>3. Les autres importent</strong> le fichier (bouton "📥 Importer")</p>
                    </div>

                    <h3>☁️ Option 3: Hébergement Gratuit</h3>
                    <div class="instruction-step">
                        <p><strong>GitHub Pages, Netlify, ou Vercel</strong></p>
                        <p>Upload des fichiers sur une plateforme gratuite pour accès internet complet</p>
                    </div>

                    <div class="network-tips">
                        <h4>💡 Conseils pour Collaboration:</h4>
                        <ul>
                            <li>Tous les utilisateurs doivent être sur le <strong>même réseau WiFi</strong></li>
                            <li><strong>Chacun peut modifier</strong> le tournoi en temps réel</li>
                            <li><strong>Synchronisation automatique</strong> toutes les 2 secondes</li>
                            <li><strong>Notifications</strong> quand quelqu'un fait des changements</li>
                            <li><strong>Gestion des conflits</strong> : le dernier changement l'emporte</li>
                            <li>Utilisez des <strong>noms clairs</strong> pour vous identifier</li>
                        </ul>
                        <div style="background: #fff3cd; padding: 15px; border-radius: 6px; margin-top: 15px; border-left: 4px solid #ffc107;">
                            <h5>⚠️ Important:</h5>
                            <p style="margin: 5px 0; font-size: 0.9rem;">
                                • Communiquez entre vous pour éviter les modifications simultanées<br>
                                • Le système synchronise automatiquement mais prévenez avant de faire des changements majeurs<br>
                                • En cas de conflit, la dernière action l'emporte
                            </p>
                        </div>
                    </div>
                </div>
                <div class="network-modal-footer">
                    <button class="btn btn-primary" onclick="this.parentElement.parentElement.parentElement.remove()">
                        ✅ Compris !
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    // Système de collaboration en temps réel
    enableCollaboration() {
        const userName = document.getElementById('userName').value.trim();
        if (!userName) {
            alert('⚠️ Veuillez entrer votre nom pour activer la collaboration !');
            return;
        }

        this.userName = userName;
        this.collaborationEnabled = true;

        // Update UI
        document.getElementById('collaborationStatus').style.display = 'block';
        document.getElementById('enableCollaboration').style.display = 'none';

        // Register user
        this.registerUser();

        // Start sync loop
        this.startSyncLoop();

        this.showNotification(`🤝 Collaboration activée pour ${userName}`, 'success');
    }

    registerUser() {
        const users = this.getActiveUsers();
        const userExists = users.find(u => u.name === this.userName);
        
        if (!userExists) {
            users.push({
                name: this.userName,
                lastSeen: Date.now(),
                id: this.generateUserId()
            });
            localStorage.setItem('norsys_active_users', JSON.stringify(users));
        }

        this.updateActiveUsersDisplay();
    }

    getActiveUsers() {
        try {
            const users = JSON.parse(localStorage.getItem('norsys_active_users') || '[]');
            // Remove users not seen in last 5 minutes
            const cutoff = Date.now() - 5 * 60 * 1000;
            return users.filter(user => user.lastSeen > cutoff);
        } catch {
            return [];
        }
    }

    updateActiveUsersDisplay() {
        const users = this.getActiveUsers();
        const container = document.getElementById('activeUsers');
        
        if (users.length > 1) {
            container.innerHTML = `
                <p style="color: var(--norsys-text); font-size: 0.9rem; margin-bottom: 8px;">
                    👥 Utilisateurs actifs (${users.length}):
                </p>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    ${users.map(user => `
                        <span style="background: ${user.name === this.userName ? 'var(--norsys-primary)' : 'var(--norsys-accent)'}; 
                                     color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem;">
                            ${user.name === this.userName ? '👑 ' + user.name : user.name}
                        </span>
                    `).join('')}
                </div>
            `;
        } else {
            container.innerHTML = '<p style="color: var(--norsys-text); font-size: 0.9rem;">Attendez que d\'autres utilisateurs se connectent...</p>';
        }
    }

    generateUserId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    startSyncLoop() {
        if (this.syncInterval) clearInterval(this.syncInterval);
        
        this.syncInterval = setInterval(() => {
            this.syncWithOthers();
            this.updateUserPresence();
        }, 2000); // Sync every 2 seconds
    }

    updateUserPresence() {
        const users = this.getActiveUsers();
        const currentUser = users.find(u => u.name === this.userName);
        if (currentUser) {
            currentUser.lastSeen = Date.now();
            localStorage.setItem('norsys_active_users', JSON.stringify(users));
        }
        this.updateActiveUsersDisplay();
    }

    syncWithOthers() {
        if (!this.collaborationEnabled) return;

        try {
            const sharedData = localStorage.getItem('norsys_shared_tournament');
            if (!sharedData) return;

            const data = JSON.parse(sharedData);
            
            // Check if data is newer than our last sync
            if (data.lastModified > this.lastSyncTime && data.modifiedBy !== this.userName) {
                // Someone else made changes, sync them
                this.handleExternalChanges(data);
            }
        } catch (error) {
            console.error('Erreur sync:', error);
        }
    }

    handleExternalChanges(data) {
        // Update tournament data
        if (data.tournament) {
            this.participants = data.participants;
            this.teams = data.teams;
            this.tournament = data.tournament;
            this.substitutes = data.substitutes;

            // Update UI
            document.getElementById('participantInput').value = this.participants.join('\n');
            this.updateParticipantCounter();
            this.displayTournament();

            this.lastSyncTime = data.lastModified;

            // Show notification
            this.showNotification(`🔄 Tournoi mis à jour par ${data.modifiedBy}`, 'info');
        }
    }

    broadcastChange(action) {
        if (!this.collaborationEnabled) return;

        const sharedData = {
            participants: this.participants,
            teams: this.teams,
            tournament: this.tournament,
            substitutes: this.substitutes,
            lastModified: Date.now(),
            modifiedBy: this.userName,
            action: action
        };

        localStorage.setItem('norsys_shared_tournament', JSON.stringify(sharedData));
        this.lastSyncTime = sharedData.lastModified;
    }

    // Override existing methods to broadcast changes
    confirmElimination(roundId) {
        const round = this.findEliminationRound(roundId);
        if (!round || !round.eliminated) {
            alert('⚠️ Veuillez d\'abord sélectionner le joueur à éliminer !');
            return;
        }

        round.completed = true;
        this.processElimination(round);
        this.displayTeamMatches();
        this.checkPhase1Completion();
        this.autoSave();
        
        // Broadcast change
        this.broadcastChange(`Élimination confirmée: ${round.eliminated}`);
    }

    confirmFinalMatch(matchId) {
        const match = this.findFinalMatch(matchId);
        if (!match || !match.winner) {
            alert('⚠️ Veuillez d\'abord sélectionner le vainqueur du match !');
            return;
        }

        const winnerName = match.winner === 'player1' ? match.player1 : match.player2;
        
        match.completed = true;
        this.advanceFinalWinner(match);
        this.displayWinnersTournament();
        this.checkFinalTournamentCompletion();
        this.autoSave();
        
        // Broadcast change
        this.broadcastChange(`Match final confirmé: ${winnerName} gagne`);
    }

    generateTournament() {
        // Vérifier les permissions
        if (!this.checkPermissions('Générer Tournoi')) {
            return;
        }

        const input = document.getElementById('participantInput').value.trim();
        const participants = this.parseParticipants(input);

        if (participants.length < 4) {
            alert('⚠️ Il faut au moins 4 participants pour créer un tournoi !');
            return;
        }

        this.participants = participants;
        this.teams = this.createTeams(participants);
        this.tournament = this.createTournamentStructure(this.teams);

        this.displayTournament();
        
        // Auto-save the new tournament
        this.autoSaveEnabled = true;
        this.autoSaveToJSON();
        
        // Broadcast change
        this.broadcastChange('Nouveau tournoi généré');
    }

    exportPowerPoint() {
        if (!this.tournament) {
            this.showNotification('❌ Aucun tournoi à exporter !', 'error');
            return;
        }

        const content = this.generatePowerPointContent();
        const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        a.href = url;
        a.download = `Tournoi_UNO_${new Date().toISOString().split('T')[0]}.html`;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('🎯 Présentation PowerPoint exportée !', 'success');
    }

    generatePowerPointContent() {
        const currentDate = new Date().toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tournoi UNO - Campus Norsys Agadir</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            line-height: 1.6;
        }

        .slide {
            width: 100vw;
            height: 100vh;
            display: none;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 40px;
            position: relative;
            overflow: hidden;
        }

        .slide.active {
            display: flex;
        }

        .slide::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(45deg, rgba(0,123,255,0.1) 0%, rgba(40,167,69,0.1) 100%);
            z-index: -1;
        }

        .title-slide {
            background: linear-gradient(135deg, #007bff 0%, #28a745 100%);
            text-align: center;
        }

        .title-slide h1 {
            font-size: 4rem;
            margin-bottom: 20px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            animation: slideInDown 1s ease-out;
        }

        .title-slide .subtitle {
            font-size: 2rem;
            margin-bottom: 30px;
            opacity: 0.9;
            animation: slideInUp 1s ease-out 0.5s both;
        }

        .title-slide .date {
            font-size: 1.5rem;
            opacity: 0.8;
            animation: fadeIn 1s ease-out 1s both;
        }

        .norsys-logo {
            position: absolute;
            top: 40px;
            right: 40px;
            width: 150px;
            height: auto;
            animation: fadeIn 1s ease-out 1.5s both;
        }

        .teams-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
            width: 100%;
            max-width: 1200px;
        }

        .team-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            animation: slideInUp 0.6s ease-out;
        }

        .team-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 45px rgba(0, 0, 0, 0.2);
        }

        .team-card h3 {
            font-size: 1.8rem;
            margin-bottom: 15px;
            color: #FFD700;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        }

        .team-card .members {
            list-style: none;
        }

        .team-card .members li {
            padding: 8px 0;
            font-size: 1.1rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .team-card .members li:last-child {
            border-bottom: none;
        }

        .bracket-section {
            width: 100%;
            max-width: 1400px;
            text-align: center;
        }

        .bracket-section h2 {
            font-size: 2.5rem;
            margin-bottom: 40px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }

        .phase-title {
            font-size: 2rem;
            margin: 30px 0;
            color: #FFD700;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        }

        .matches-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }

        .match-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .match-card .vs {
            font-size: 1.5rem;
            color: #FFD700;
            margin: 10px 0;
            font-weight: bold;
        }

        .navigation {
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 15px;
            z-index: 1000;
        }

        .nav-btn {
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            border: none;
            color: white;
            padding: 12px 20px;
            border-radius: 50px;
            cursor: pointer;
            font-size: 1rem;
            font-weight: 600;
            transition: all 0.3s ease;
            border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .nav-btn:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }

        .slide-counter {
            position: fixed;
            top: 30px;
            left: 30px;
            background: rgba(0, 0, 0, 0.3);
            padding: 10px 20px;
            border-radius: 25px;
            font-weight: 600;
            z-index: 1000;
        }

        @keyframes slideInDown {
            from { transform: translateY(-100px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }

        @keyframes slideInUp {
            from { transform: translateY(100px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        .winner-highlight {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            border: 2px solid #FFD700;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }

        @media print {
            .navigation, .slide-counter { display: none; }
            .slide { page-break-after: always; }
        }
    </style>
</head>
<body>
    <div class="slide-counter">
        <span id="currentSlide">1</span> / <span id="totalSlides">0</span>
    </div>

    <!-- Slide 1: Titre -->
    <div class="slide title-slide active">
        <svg class="norsys-logo" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
            <rect width="200" height="60" fill="#007bff" rx="8"/>
            <text x="100" y="35" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="24" font-weight="bold">NORSYS</text>
        </svg>
        <h1>🎯 TOURNOI UNO</h1>
        <div class="subtitle">Campus Norsys Agadir</div>
        <div class="date">${currentDate}</div>
    </div>

    <!-- Slide 2: Statistiques -->
    <div class="slide">
        <h1>📊 Statistiques du Tournoi</h1>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 40px; width: 100%; max-width: 800px; margin-top: 40px;">
            <div class="team-card" style="text-align: center;">
                <h3>👥 Participants</h3>
                <div style="font-size: 3rem; margin: 20px 0; color: #FFD700;">${this.participants.length}</div>
                <p>Joueurs inscrits</p>
            </div>
            <div class="team-card" style="text-align: center;">
                <h3>🏆 Équipes</h3>
                <div style="font-size: 3rem; margin: 20px 0; color: #28a745;">${this.teams.length}</div>
                <p>Équipes formées</p>
            </div>
        </div>
    </div>

    <!-- Slides pour chaque équipe -->
    ${this.teams.map((team, index) => `
    <div class="slide">
        <h1>🏆 ${team.name}</h1>
        <div class="team-card" style="max-width: 600px; font-size: 1.3rem;">
            <h3 style="margin-bottom: 30px;">👥 Membres de l'équipe</h3>
            <ul class="members">
                ${team.members.map(member => `<li>🎮 ${member}</li>`).join('')}
            </ul>
        </div>
    </div>
    `).join('')}

    <!-- Slide: Toutes les équipes -->
    <div class="slide">
        <h1>🏆 Toutes les Équipes</h1>
        <div class="teams-grid">
            ${this.teams.map(team => `
            <div class="team-card">
                <h3>${team.name}</h3>
                <ul class="members">
                    ${team.members.map(member => `<li>${member}</li>`).join('')}
                </ul>
            </div>
            `).join('')}
        </div>
    </div>

    <!-- Slide: Structure du tournoi -->
    <div class="slide">
        <div class="bracket-section">
            <h2>🎯 Structure du Tournoi</h2>
            
            <div class="phase-title">Phase 1: Éliminations dans chaque équipe</div>
            <div class="matches-grid">
                ${this.teams.map(team => `
                <div class="match-card">
                    <h4>${team.name}</h4>
                    <div class="vs">4 joueurs → 1 vainqueur</div>
                    <p>Élimination directe</p>
                </div>
                `).join('')}
            </div>

            <div class="phase-title">Phase 2: Finale des vainqueurs</div>
            <div class="match-card" style="max-width: 400px; margin: 0 auto;">
                <h4>🏆 GRANDE FINALE</h4>
                <div class="vs">${this.teams.length} vainqueurs → 1 champion</div>
                <p>Match décisif</p>
            </div>
        </div>
    </div>

    <!-- Slide: Bonne chance -->
    <div class="slide title-slide">
        <h1>🎉 Bonne Chance !</h1>
        <div class="subtitle">Que le meilleur gagne !</div>
        <div style="font-size: 1.2rem; margin-top: 30px; opacity: 0.8;">
            Organisé par Campus Norsys Agadir
        </div>
    </div>

    <div class="navigation">
        <button class="nav-btn" onclick="previousSlide()">⬅️ Précédent</button>
        <button class="nav-btn" onclick="nextSlide()">Suivant ➡️</button>
    </div>

    <script>
        let currentSlideIndex = 0;
        const slides = document.querySelectorAll('.slide');
        const totalSlides = slides.length;
        
        document.getElementById('totalSlides').textContent = totalSlides;

        function showSlide(index) {
            slides.forEach((slide, i) => {
                slide.classList.toggle('active', i === index);
            });
            document.getElementById('currentSlide').textContent = index + 1;
        }

        function nextSlide() {
            currentSlideIndex = (currentSlideIndex + 1) % totalSlides;
            showSlide(currentSlideIndex);
        }

        function previousSlide() {
            currentSlideIndex = (currentSlideIndex - 1 + totalSlides) % totalSlides;
            showSlide(currentSlideIndex);
        }

        // Navigation au clavier
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                nextSlide();
            } else if (e.key === 'ArrowLeft') {
                previousSlide();
            }
        });

        // Auto-play (optionnel)
        // setInterval(nextSlide, 10000); // Change de slide toutes les 10 secondes
    </script>
</body>
</html>`;
    }
}
