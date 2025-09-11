import whisper
import pyaudio
import wave
import warnings
import threading
import time
import os
import google.generativeai as genai
from google.ai.generativelanguage_v1beta import types
from typing import Dict, List
import json

warnings.filterwarnings("ignore")

class EcoLens:
    def __init__(self, google_api_key: str):
        """Initialize EcoLens with speech recognition and TTS capabilities"""
        # Initialize Whisper for speech-to-text
        self.whisper_model = whisper.load_model("large")
        
        # Initialize Google AI client for TTS and analysis
        genai.configure(api_key=google_api_key)
        self.client = genai.GenerativeModel("gemini-2.0-flash-exp")
        
        # Audio recording parameters
        self.is_recording = False
        self.audio_filename = "user_query.wav"
        self.chunk = 1024
        self.format = pyaudio.paInt16
        self.channels = 1
        self.rate = 16000
        
        # Voice configurations
        self.voice_configs = {
            'english': {'male': 'Puck', 'female': 'Kore'},
            'hindi': {'male': 'Puck', 'female': 'Kore'},
            'marathi': {'male': 'Puck', 'female': 'Kore'}
        }
        
        # System prompt for EcoLens
        self.system_prompt = """
        You are EcoLens, an AI-powered environmental impact assistant for consumer products, especially cosmetics and packaging.
        Your job is to help users understand and reduce the environmental footprint of their purchases by:
        
        • CO₂ Emissions & Origins: Map ingredients to their sources and calculate their carbon footprint.
        • Eco-Comparison Mode: Compare two or more products for environmental impact.
        • Personalized Green Scorecard: Rate products on sustainability, resource use, and eco-friendliness.
        • Alternative Suggestions: Recommend greener options that work as well as the original.
        • Green Alerts: Warn about harmful or high-impact ingredients.
        • Recycling Guidance: Give local recycling and disposal instructions.
        • Visual Insights: Provide charts or summaries for better understanding.
        • Voice-Friendly Responses: Keep answers conversational and clear.
        
        Tone & Style: Friendly, supportive, simple analogies, no judgment.
        Rules: Be transparent about missing data, explain reasoning, avoid greenwashing.
        Format: Use bullet points, short paragraphs, numeric values with units, and tables for comparisons.
        """

    def record_audio(self, duration=None):
        """Record audio for specified duration or until stopped"""
        audio = pyaudio.PyAudio()
        
        print("🎤 EcoLens is listening... (Press Enter to stop or wait for duration)")
        
        try:
            stream = audio.open(format=self.format,
                              channels=self.channels,
                              rate=self.rate,
                              input=True,
                              frames_per_buffer=self.chunk)
            
            frames = []
            self.is_recording = True
            
            if duration:
                # Record for specific duration
                for i in range(0, int(self.rate / self.chunk * duration)):
                    if not self.is_recording:
                        break
                    data = stream.read(self.chunk)
                    frames.append(data)
            else:
                # Record until stopped
                while self.is_recording:
                    data = stream.read(self.chunk)
                    frames.append(data)
            
            print("🛑 Recording stopped")
            
            stream.stop_stream()
            stream.close()
            audio.terminate()
            
            # Save the recorded audio
            wf = wave.open(self.audio_filename, 'wb')
            wf.setnchannels(self.channels)
            wf.setsampwidth(audio.get_sample_size(self.format))
            wf.setframerate(self.rate)
            wf.writeframes(b''.join(frames))
            wf.close()
            
            return self.audio_filename
            
        except Exception as e:
            print(f"❌ Error recording audio: {e}")
            return None

    def stop_recording(self):
        """Stop the recording"""
        self.is_recording = False

    def transcribe_audio(self, audio_file):
        """Transcribe the audio file using Whisper"""
        print("🔄 Processing your voice query...")
        try:
            result = self.whisper_model.transcribe(audio_file)
            return result
        except Exception as e:
            print(f"❌ Transcription error: {e}")
            return None

    def analyze_environmental_impact(self, query: str) -> str:
        """Analyze environmental impact using EcoLens system prompt"""
        try:
            full_prompt = f"{self.system_prompt}\n\nUser Query: {query}"
            
            response = self.client.generate_content(full_prompt)
            return response.text
            
        except Exception as e:
            return f"❌ Analysis error: {str(e)}"

    def wave_file(self, filename: str, pcm_data: bytes, channels: int = 1, rate: int = 24000, sample_width: int = 2):
        """Save PCM data as a wave file"""
        try:
            with wave.open(filename, "wb") as wf:
                wf.setnchannels(channels)
                wf.setsampwidth(sample_width)
                wf.setframerate(rate)
                wf.writeframes(pcm_data)
        except Exception as e:
            print(f"❌ Error saving audio: {e}")

    def text_to_speech(self, text: str, output_file: str = "ecolens_response.wav") -> str:
        """Convert EcoLens response to speech"""
        try:
            # Use a simplified approach for TTS
            # First, try with the updated API structure
            model = genai.GenerativeModel("gemini-2.0-flash-exp")
            
            # Create a shorter, more voice-friendly version of the text
            voice_text = self.make_voice_friendly(text)
            
            # Try generating content with audio modality
            response = model.generate_content(
                f"Please provide an audio response for: {voice_text}",
                generation_config=genai.types.GenerationConfig(
                    response_modalities=["AUDIO"]
                )
            )

            # Check if we got audio data
            if hasattr(response, 'candidates') and len(response.candidates) > 0:
                candidate = response.candidates[0]
                if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                    for part in candidate.content.parts:
                        if hasattr(part, 'inline_data'):
                            audio_data = part.inline_data.data
                            self.wave_file(output_file, audio_data)
                            return f"🔊 Audio response saved to {output_file}"
            
            # If TTS fails, offer alternative
            return "🔊 Audio generation not available. Text response provided above."

        except Exception as e:
            # Fallback: suggest using system TTS or return gracefully
            print(f"📢 TTS unavailable: {str(e)}")
            return "🔊 Audio generation not available. You can copy the text above to your system's text-to-speech."

    def make_voice_friendly(self, text: str) -> str:
        """Convert detailed text response to a more voice-friendly version"""
        # Limit to first 2-3 paragraphs for voice
        lines = text.split('\n')
        voice_lines = []
        
        for line in lines[:15]:  # Take first 15 lines
            if line.strip() and not line.strip().startswith('*'):
                # Remove markdown formatting for voice
                clean_line = line.replace('*', '').replace('#', '').strip()
                if clean_line:
                    voice_lines.append(clean_line)
        
        return ' '.join(voice_lines[:5])  # Limit to first 5 meaningful lines

    def voice_interaction(self, duration=None):
        """Complete voice interaction: record, transcribe, analyze, and respond"""
        try:
            # Start recording in a separate thread
            recording_thread = threading.Thread(target=self.record_audio, args=(duration,))
            recording_thread.start()
            
            if not duration:
                # Wait for user input to stop recording
                input()  # Press Enter to stop
                self.stop_recording()
            
            recording_thread.join()
            
            # Transcribe the recorded audio
            result = self.transcribe_audio(self.audio_filename)
            
            if result:
                user_query = result['text']
                print(f"\n📝 You said: {user_query}")
                print(f"🌍 Detected language: {result['language']}")
                
                # Analyze environmental impact
                print("\n🌱 EcoLens Analysis:")
                analysis = self.analyze_environmental_impact(user_query)
                print(analysis)
                
                # Ask if user wants voice response
                voice_choice = input("\n🔊 Would you like to hear this as audio? (y/n): ").lower().strip()
                if voice_choice == 'y':
                    print("🔊 Generating voice response...")
                    audio_result = self.text_to_speech(analysis)
                    print(audio_result)
                    if "saved to" in audio_result:
                        print("💡 Play the generated audio file to hear EcoLens speak!")
                        print("🎵 You can also copy the text above to your system's text-to-speech.")
                
            # Clean up
            if os.path.exists(self.audio_filename):
                os.remove(self.audio_filename)
                
            return result
            
        except Exception as e:
            print(f"❌ Error in voice interaction: {e}")
            return None

    def text_interaction(self, query: str):
        """Text-based interaction with EcoLens"""
        print(f"\n📝 Your query: {query}")
        print("\n🌱 EcoLens Analysis:")
        
        analysis = self.analyze_environmental_impact(query)
        print(analysis)
        
        # Optionally generate voice response
        voice_choice = input("\n🔊 Would you like to hear this as audio? (y/n): ").lower().strip()
        if voice_choice == 'y':
            print("🔊 Generating voice response...")
            audio_result = self.text_to_speech(analysis)
            print(audio_result)
            print("💡 Play 'ecolens_response.wav' to hear EcoLens speak!")
        
        return analysis

    def eco_comparison_mode(self, products: List[str]):
        """Compare multiple products for environmental impact"""
        products_str = ", ".join(products)
        comparison_query = f"Compare the environmental impact of these products: {products_str}. Provide a detailed comparison table with scores."
        
        return self.analyze_environmental_impact(comparison_query)

    def get_green_alternatives(self, product: str):
        """Get green alternatives for a specific product"""
        alternatives_query = f"Suggest eco-friendly alternatives for {product}. Include specific brand recommendations if possible."
        
        return self.analyze_environmental_impact(alternatives_query)

    def calculate_carbon_footprint(self, ingredients: List[str]):
        """Calculate carbon footprint for specific ingredients"""
        ingredients_str = ", ".join(ingredients)
        footprint_query = f"Calculate the carbon footprint and environmental impact of these ingredients: {ingredients_str}. Provide specific CO2 values if available."
        
        return self.analyze_environmental_impact(footprint_query)

def main():
    # You need to set your Google AI API key here
    GOOGLE_API_KEY = "AIzaSyAFnviUJnaJiM0VcyK4twCSBDHQ34zVc9Q"
    
    if GOOGLE_API_KEY == "AIzaSyAFnviUJnaJiM0VcyK4twCSBDHQ34zVc9Q":
        print("❌ Please set your Google AI API key in the GOOGLE_API_KEY variable")
        return
    
    ecolens = EcoLens(GOOGLE_API_KEY)
    
    print("🌱 Welcome to EcoLens - Your AI Environmental Impact Assistant!")
    print("💚 I help you make eco-friendly choices for cosmetics and consumer products.")
    
    while True:
        print("\n" + "="*60)
        print("🌱 ECOLENS - ENVIRONMENTAL IMPACT ASSISTANT")
        print("="*60)
        print("1. 🎤 Voice Query (Press Enter to stop recording)")
        print("2. 🎤 Voice Query (Specific duration)")
        print("3. 💬 Text Query")
        print("4. ⚖️  Compare Products")
        print("5. 🌿 Get Green Alternatives")
        print("6. 📊 Calculate Carbon Footprint")
        print("7. 🚪 Exit")
        
        choice = input("\nChoose your option (1-7): ").strip()
        
        if choice == "1":
            print("\n🎤 Starting voice recording...")
            print("Ask me about any product's environmental impact!")
            ecolens.voice_interaction()
            
        elif choice == "2":
            try:
                duration = float(input("Enter recording duration in seconds: "))
                print(f"\n🎤 Recording for {duration} seconds...")
                ecolens.voice_interaction(duration=duration)
            except ValueError:
                print("❌ Invalid duration. Please enter a number.")
                
        elif choice == "3":
            query = input("\n💬 Enter your environmental impact query: ")
            ecolens.text_interaction(query)
            
        elif choice == "4":
            print("\n⚖️ Product Comparison Mode")
            num_products = int(input("How many products to compare? "))
            products = []
            for i in range(num_products):
                product = input(f"Enter product {i+1}: ")
                products.append(product)
            
            print("\n🔄 Comparing products...")
            result = ecolens.eco_comparison_mode(products)
            print(result)
            
        elif choice == "5":
            product = input("\n🌿 Enter product name for green alternatives: ")
            print("\n🔄 Finding eco-friendly alternatives...")
            result = ecolens.get_green_alternatives(product)
            print(result)
            
        elif choice == "6":
            print("\n📊 Carbon Footprint Calculator")
            ingredients_input = input("Enter ingredients (comma-separated): ")
            ingredients = [ing.strip() for ing in ingredients_input.split(",")]
            
            print("\n🔄 Calculating carbon footprint...")
            result = ecolens.calculate_carbon_footprint(ingredients)
            print(result)
            
        elif choice == "7":
            print("\n🌱 Thank you for choosing EcoLens!")
            print("💚 Keep making eco-friendly choices! 🌍")
            break
            
        else:
            print("❌ Invalid choice. Please try again.")

if __name__ == "__main__":
    main()