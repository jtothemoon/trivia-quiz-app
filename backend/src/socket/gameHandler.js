const gameService = require('../services/gameService');
const { saveGameResult, updateUserStats, updateRankings } = require('../services/firebaseService');

module.exports = (io, socket) => {
  /**
   * Start game
   * Data: { roomId }
   */
  socket.on('game:start', async (data) => {
    try {
      const { roomId } = data;

      const game = await gameService.startGame(roomId);

      // Send game started event with first question
      const firstQuestion = game.getCurrentQuestion();

      io.to(roomId).emit('game:started', {
        gameId: game.gameId,
        firstQuestion: {
          id: firstQuestion.id,
          category: firstQuestion.category,
          difficulty: firstQuestion.difficulty,
          question: firstQuestion.question,
          allAnswers: firstQuestion.allAnswers
        },
        questionNumber: 1,
        totalQuestions: game.questions.length
      });

      console.log(`🎮 Game started: ${game.gameId}`);

    } catch (error) {
      console.error('Error starting game:', error);
      socket.emit('error', {
        message: 'Failed to start game',
        code: 'GAME_START_ERROR'
      });
    }
  });

  /**
   * Submit answer
   * Data: { gameId, questionId, answer, timeSpent }
   */
  socket.on('game:answer', async (data) => {
    try {
      const { gameId, answer, timeSpent } = data;

      const result = gameService.submitAnswer(gameId, socket.id, answer, timeSpent);

      // Send answer result to the player
      socket.emit('game:answer-result', {
        isCorrect: result.isCorrect,
        score: result.score,
        correctAnswer: result.correctAnswer,
        totalScore: result.totalScore
      });

      // Send updated scores to all players
      const game = gameService.getGame(gameId);
      const scores = Object.entries(game.players).map(([userId, data]) => ({
        userId,
        nickname: data.nickname,
        score: data.score
      }));

      io.to(game.roomId).emit('game:scores', { scores });

      console.log(`📝 Answer submitted by ${socket.id}: ${result.isCorrect ? 'Correct' : 'Incorrect'}`);

      // Check if all players have answered
      const allAnswered = gameService.checkAllAnswered(gameId);
      if (allAnswered) {
        console.log(`⏭️ All players answered, moving to next question`);

        // Wait 2 seconds before moving to next question
        setTimeout(async () => {
          const nextQ = gameService.nextQuestion(gameId);

          if (!nextQ) {
            // Game finished
            const result = gameService.finishGame(gameId);

            // Save game result to Firebase
            try {
              await saveGameResult({
                roomId: game.roomId,
                category: game.category,
                difficulty: game.difficulty,
                players: game.players,
                startedAt: game.startedAt,
                finishedAt: game.finishedAt,
                winner: result.winner
              });

              // Update user stats and rankings
              for (const [userId, playerData] of Object.entries(game.players)) {
                await updateUserStats(userId, {
                  score: playerData.score,
                  isWinner: userId === result.winner
                });
                await updateRankings(userId, game.category, playerData.score);
              }
            } catch (error) {
              console.error('Error saving game result:', error);
            }

            // Send game finished event
            io.to(game.roomId).emit('game:finished', {
              finalScores: game.getFinalScores(),
              winner: result.winner
            });

            console.log(`🏁 Game finished: ${gameId}, Winner: ${result.winner}`);
          } else {
            // Send next question
            io.to(game.roomId).emit('game:question', {
              question: {
                id: nextQ.id,
                category: nextQ.category,
                difficulty: nextQ.difficulty,
                question: nextQ.question,
                allAnswers: nextQ.allAnswers
              },
              questionNumber: game.currentQuestionIndex + 1,
              totalQuestions: game.questions.length
            });

            console.log(`➡️ Next question sent for game: ${gameId}`);
          }
        }, 2000);
      }

    } catch (error) {
      console.error('Error submitting answer:', error);
      socket.emit('error', {
        message: 'Failed to submit answer',
        code: 'GAME_ANSWER_ERROR'
      });
    }
  });

  /**
   * Request next question
   * Data: { gameId }
   */
  socket.on('game:next', async (data) => {
    try {
      const { gameId } = data;

      const game = gameService.getGame(gameId);
      const nextQ = gameService.nextQuestion(gameId);

      if (!nextQ) {
        // Game finished
        const result = gameService.finishGame(gameId);

        // Save game result to Firebase
        try {
          await saveGameResult({
            roomId: game.roomId,
            category: game.category,
            difficulty: game.difficulty,
            players: game.players,
            startedAt: game.startedAt,
            finishedAt: game.finishedAt,
            winner: result.winner
          });

          // Update user stats and rankings
          for (const [userId, playerData] of Object.entries(game.players)) {
            await updateUserStats(userId, {
              score: playerData.score,
              isWinner: userId === result.winner
            });
            await updateRankings(userId, game.category, playerData.score);
          }
        } catch (error) {
          console.error('Error saving game result:', error);
        }

        // Send game finished event
        io.to(game.roomId).emit('game:finished', {
          finalScores: game.getFinalScores(),
          winner: result.winner
        });

        console.log(`🏁 Game finished: ${gameId}, Winner: ${result.winner}`);
      } else {
        // Send next question
        io.to(game.roomId).emit('game:question', {
          question: {
            id: nextQ.id,
            category: nextQ.category,
            difficulty: nextQ.difficulty,
            question: nextQ.question,
            allAnswers: nextQ.allAnswers
          },
          questionNumber: game.currentQuestionIndex + 1,
          totalQuestions: game.questions.length
        });

        console.log(`➡️ Next question sent for game: ${gameId}`);
      }

    } catch (error) {
      console.error('Error getting next question:', error);
      socket.emit('error', {
        message: 'Failed to get next question',
        code: 'GAME_NEXT_ERROR'
      });
    }
  });
};
