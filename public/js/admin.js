class UFCEventManager {
    static async addEvent(eventData) {
        try {
            const response = await fetch('/admin/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventData)
            });
            
            if (!response.ok) {
                throw new Error('Failed to add event');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error adding event:', error);
            throw error;
        }
    }

    static async addFight(eventId, fightData) {
        try {
            const response = await fetch(`/admin/events/${eventId}/fights`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(fightData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to add fight');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error adding fight:', error);
            throw error;
        }
    }

    static async updateFightResult(fightId, resultData) {
        try {
            const response = await fetch(`/admin/fights/${fightId}/result`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(resultData)
            });
            
            if (!response.ok) {
                throw new Error('Failed to update fight result');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error updating fight result:', error);
            throw error;
        }
    }

    static async getFightsForEvent(eventId) {
        try {
            const response = await fetch(`/admin/events/${eventId}/fights`);
            if (!response.ok) {
                throw new Error('Failed to fetch fights');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching fights:', error);
            throw error;
        }
    }
}

function handleEventSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    const eventData = {
        name: formData.get('name'),
        event_date: formData.get('event_date'),
        poster_url: formData.get('poster_url')
    };
    
    UFCEventManager.addEvent(eventData)
        .then(response => {
            alert('Event added successfully!');
            window.location.reload();
        })
        .catch(error => {
            alert('Failed to add event: ' + error.message);
        });
}

function handleFightSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const eventId = form.dataset.eventId;
    
    if (!eventId) {
        alert('Please select an event first');
        return;
    }
    
    const fightData = {
        event_id: eventId,
        fighter1_name: formData.get('fighter1_name'),
        fighter2_name: formData.get('fighter2_name'),
        fighter1_image_url: formData.get('fighter1_image_url'),
        fighter2_image_url: formData.get('fighter2_image_url'),
        weight_class: formData.get('weight_class'),
        is_main_event: formData.get('is_main_event') === 'on',
        number_of_rounds: parseInt(formData.get('number_of_rounds'))
    };
    
    UFCEventManager.addFight(eventId, fightData)
        .then(response => {
            alert('Fight added successfully!');
            window.location.reload();
        })
        .catch(error => {
            alert('Failed to add fight: ' + error.message);
        });
}

function handleFightResultSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    const fightId = formData.get('fight_id');
    if (!fightId) {
        alert('Please select a fight first');
        return;
    }
    
    const resultData = {
        winner: formData.get('winner'),
        method: formData.get('win_method'),
        round: parseInt(formData.get('winning_round'))
    };
    
    UFCEventManager.updateFightResult(fightId, resultData)
        .then(response => {
            alert('Fight result updated successfully!');
            window.location.reload();
        })
        .catch(error => {
            alert('Failed to update fight result: ' + error.message);
        });
}

function calculateAccuracy(predictions) {
    if (!predictions || predictions.length === 0) return 0;
    
    const correctPredictions = predictions.filter(pred => 
        pred.prediction === pred.actualResult && pred.actualResult !== null
    ).length;
    
    const completedPredictions = predictions.filter(pred => 
        pred.actualResult !== null
    ).length;
    
    return completedPredictions > 0 
        ? ((correctPredictions / completedPredictions) * 100).toFixed(1) 
        : 0;
}
