import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Union
from difflib import SequenceMatcher

class IngredientCO2Mapper:
    def __init__(self, co2_data_path: Optional[str] = None):
        """
        Initialize the mapper with optional CO2 emission data
        
        Args:
            co2_data_path: Path to CSV file containing CO2 emission data
        """
        # Corrected ingredient mapping - each ingredient maps to its actual origin
        self.ingredient_mapping = {'1,2-Hexanediol': 'microbial fermentation',
    '4-T-Butylcyclohexanol': 'synthetic fragrance compound',  # Changed from vague "fermentation"
    'Acer Saccharum Extract': 'plant extract',  # Standardized
    'Acetyl Dipeptide-1 Cetyl Ester': 'synthetic peptide',  # More specific than "fatty alcohol"
    'Acetyl Glucosamine': 'shellfish chitin',  # More specific
    'Acetyl Hexapeptide-1': 'synthetic peptide',  # More specific than "bacteria"
    'Acetyl Hexapeptide-8': 'synthetic peptide',  # More specific than "botanical origin"
    'Acrylamide/Sodium Acryloyldimethyltaurate Copolymer': 'synthetic polymer',  # More specific
    'Acrylates/Vinyl Isodecanoate Crosspolymer': 'synthetic polymer',  # More specific than "nature"
    'Adansonia Digitata Seed Oil': 'plant oil',  # Simplified
    'Adenosine': 'microbial fermentation',  # More accurate than "fungal source"
    'Adenosine Phosphate': 'microbial fermentation',  # More specific
    'Alanine': 'microbial fermentation',  # More specific than "biochemical"
    'Alcohol': 'plant fermentation',  # More specific
    'Alcohol Denat.': 'plant fermentation',  # Standardized
    'Algae Extract': 'marine algae',  # More specific
    'Allantoin': 'plant extract',  # Standardized
    'Allium Cepa Bulb Extract': 'plant extract',  # Standardized
    'Aloe Barbadensis Flower Extract': 'plant extract',  # Standardized
    'Aloe Barbadensis Leaf Extract': 'plant extract',  # Standardized
    'Aloe Barbadensis Leaf Juice': 'plant extract',  # Standardized
    'Aloe Barbadensis Leaf Juice Powder': 'plant extract',  # Standardized
    'Aloe Barbadensis Leaf Water': 'plant extract',  # Standardized
    'Alpha-Arbutin': 'plant extract',  # More accurate than "beta-glucan"
    'Alpha-Isomethyl Ionone': 'synthetic fragrance compound',  # More accurate
    'Alumina': 'mineral processing',  # More specific
    'Aluminum Hydroxide': 'mineral processing',  # Standardized
    'Aluminum Starch Octenylsuccinate': 'plant starch modification',  # More specific
    'Aminopropyl Ascorbyl Phosphate': 'synthetic vitamin derivative',  # More accurate
    'Ammonium': 'synthetic chemical',  # More accurate than "fish"
    'Ammonium Acryloyldimethyltaurate/Beheneth-25 Methacrylate Crosspolymer': 'synthetic polymer',
    'Ammonium Acryloyldimethyltaurate/VP Copolymer': 'synthetic polymer',  # More accurate
    'Ammonium Polyacryloyldimethyl Taurate': 'synthetic polymer',  # More specific
    'Amodimethicone': 'synthetic silicone',  # More specific
    'Anhydroxylitol': 'plant sugar derivative',  # More specific
    'Anthemis Nobilis Flower Oil': 'plant oil',  # Standardized
    'Aphanizomenon Flos-Aquae Extract': 'freshwater algae',  # More accurate than "aloe vera"
    'Arabidopsis Thaliana Extract': 'plant extract',  # Standardized
    'Arbutin': 'plant extract',  # Standardized
    'Argania Spinosa Kernel Oil': 'plant oil',  # Standardized
    'Arginine': 'microbial fermentation',  # More specific
    'Artemia Extract': 'marine crustacean',  # More specific
    'Ascorbic Acid': 'synthetic vitamin',  # More accurate for commercial production
    'Ascorbyl Palmitate': 'synthetic vitamin derivative',  # More specific
    'Ascorbyl Tocopheryl Maleate': 'synthetic vitamin derivative',  # More specific
    'Aspalathus Linearis Leaf Extract': 'plant extract',  # Standardized
    'Aspartic Acid': 'microbial fermentation',  # More specific
    'Astragalus Membranaceus Root Extract': 'plant extract',  # Standardized
    'Astrocaryum Murumuru Seed Butter': 'plant butter',  # More specific
    'Butyl Methoxydibenzoylmethane': 'synthetic chemical',  # More accurate than "fungus"
    'Azelaic Acid': 'microbial fermentation',  # More accurate
    'Bacillus Ferment': 'bacterial fermentation',  # More specific
    'Behenyl Alcohol': 'plant fatty alcohol',  # More specific
    'Bentonite': 'mineral clay',  # Standardized
    'Benzophenone-3': 'synthetic chemical',  # More accurate than "fungus"
    'Benzoyl Peroxide': 'synthetic chemical',  # More accurate than "fungal"
    'Benzyl Alcohol': 'synthetic chemical',  # More accurate than "fungi"
    'Benzyl Benzoate': 'synthetic chemical',  # More accurate than "fungus"
    'Benzyl Salicylate': 'synthetic fragrance compound',  # More accurate
    'Beta-Carotene': 'plant extract',  # More accurate than "astaxanthin"
    'Beta Vulgaris Root Extract': 'plant extract',  # Standardized
    'Betaine': 'plant extract',  # Standardized
    'BHT': 'synthetic antioxidant',  # More specific
    'Bifida Ferment Filtrate': 'bacterial fermentation',  # More specific
    'Bifida Ferment Lysate': 'bacterial fermentation',  # More accurate than "fungal"
    'Biotin': 'microbial fermentation',  # More accurate for commercial production
    'Bis (Tripeptide-1) Copper Acetate': 'synthetic peptide',  # More specific
    'Bis-Ethylhexyloxyphenol Methoxyphenyl Triazine': 'synthetic chemical',  # More accurate
    'Bisabolol': 'plant extract',  # Standardized
    'Boswellia Serrata Extract': 'plant extract',  # Standardized
    'Brassica Oleracea Capitata Leaf Extract': 'plant extract',  # Standardized
    'Butylene Glycol': 'synthetic chemical',  # More accurate for commercial production
    'Butyrospermum Parkii Butter Extract': 'plant butter',  # More specific
    'C1-8 Alkyl Tetrahydroxycyclohexanoate': 'synthetic fatty acid derivative',  # More specific
    'C11-15 Pareth-7': 'synthetic surfactant',  # More accurate than "mineral clay"
    'C12-13 Pareth-23': 'synthetic surfactant',  # More accurate than "parabens"
    'C12-13 Pareth-3': 'synthetic surfactant',  # More accurate than "paraffin wax"
    'C12-14 Pareth-12': 'synthetic surfactant',  # More specific
    'C12-15 Alkyl Benzoate': 'synthetic ester',  # More specific
    'C12-20 Alkyl Glucoside': 'plant sugar derivative',  # More accurate than "glycerin"
    'C13-14 Isoparaffin': 'petroleum derivative',  # Standardized
    'C14-22 Alcohols': 'plant fatty alcohol',  # More accurate than "aloe vera"
    'Caesalpinia Spinosa Gum': 'plant gum',  # Standardized
    'Caffeine': 'plant extract',  # More general than just coffee
    'Calcium Sodium Borosilicate': 'mineral processing',  # More specific
    'Calendula Officinalis Flower Oil': 'plant oil',  # Standardized
    'Calophyllum Inophyllum Seed Oil': 'plant oil',  # More accurate than "coconut"
    'Camellia Japonica Flower Extract': 'plant extract',  # Standardized
    'Camellia Oleifera Leaf Extract': 'plant extract',  # Standardized
    'Camellia Sinensis Leaf Extract': 'plant extract',  # Standardized
    'Caprylic/Capric/Myristic/Stearic Triglyceride': 'plant oil derivative',  # More specific
    'Caprylic/Capric Triglyceride': 'plant oil derivative',  # More specific
    'Caprylyl/Capryl Glucoside': 'plant sugar derivative',  # More specific
    'Caprylyl Glycol': 'synthetic chemical',  # More accurate for commercial production
    'Carbomer': 'synthetic polymer',  # More specific
    'Castor Oil/IPDI Copolymer': 'plant oil derivative',  # More specific
    'Centella Asiatica Extract': 'plant extract',  # Standardized
    'Cera Alba': 'animal wax',  # More specific (beeswax)
    'Ceramide EOP': 'synthetic ceramide',  # More accurate than "fungal"
    'Ceramide AP': 'synthetic ceramide',  # More accurate than "fungal"
    'Ceramide AS': 'synthetic ceramide',  # More accurate than plant source
    'Ceramide NP': 'synthetic ceramide',  # More accurate than plant source
    'Ceteareth-20': 'synthetic surfactant',  # More specific
    'Ceteareth-60 Myristyl Glycol': 'synthetic surfactant',  # More specific
    'Cetearyl Alcohol': 'plant fatty alcohol',  # More specific
    'Cetearyl Olivate': 'plant oil derivative',  # More specific
    'Ceteth-10 Phosphate': 'synthetic surfactant',  # More accurate than "fungus"
    'Cetraria Islandica Thallus Extract': 'lichen extract',  # More accurate than "algae"
    'Cetyl Alcohol': 'plant fatty alcohol',  # More specific
    'Cetyl Lactate': 'synthetic ester',  # More specific
    'Cetyl Palmitate': 'synthetic ester',  # More specific
    'Cetyl PEG/PPG-10/1 Dimethicone': 'synthetic silicone',  # More accurate
    'Chamomilla Recutita Flower Extract': 'plant extract',  # Standardized
    'Chamomilla Recutita Flower Oil': 'plant oil',  # Standardized
    'Chlorella Vulgaris Extract': 'freshwater algae',  # More specific
    'Chlorphenesin': 'synthetic preservative',  # Confirmed
    'Cholesterol': 'animal fat derivative',  # More specific
    'Chondrus Crispus Extract': 'marine algae',  # More specific
    'Ci 77491': 'mineral pigment',  # More accurate than "copper complex"
    'Ci 77492': 'mineral pigment',  # More accurate than "silica"
    'Ci 77499': 'mineral pigment',  # More accurate than "bacterial fermentation"
    'Ci 77891': 'mineral pigment',  # Corrected (titanium dioxide, not iron oxide)
    'Citral': 'plant extract',  # More general than just citrus
    'Citric Acid': 'microbial fermentation',  # More accurate for commercial production
    'Citronellol': 'plant extract',  # More specific than "floral"
    'Citrullus Lanatus Fruit Extract': 'plant extract',  # Standardized
    'Citrus Aurantium Bergamia Fruit Oil': 'plant oil',  # Standardized
    'Citrus Aurantium Bergamia Peel Oil': 'plant oil',  # Standardized
    'Citrus Aurantium Dulcis Fruit Extract': 'plant extract',  # Standardized
    'Citrus Aurantium Dulcis Peel Oil': 'plant oil',  # Standardized
    'Citrus Limon Fruit Extract': 'plant extract',  # Standardized
    'Cladosiphon Okamuranus Extract': 'marine algae',  # More specific
    'Climbazole': 'synthetic antifungal',  # More accurate than just "fungus"
    'Clitoria Ternatea Flower Extract': 'plant extract',  # Standardized
    'Cocamide Methyl Mea': 'plant oil derivative',  # More specific
    'Cocamidopropyl Betaine': 'plant oil derivative',  # More specific
    'Coccinia Indica Fruit Extract': 'plant extract',  # Standardized
    'Coco-Caprylate/Caprate': 'plant oil derivative',  # More specific
    'Copper Palmitoyl Heptapeptide-14': 'synthetic peptide',  # More specific
    'Copper Tripeptide-1': 'synthetic peptide',  # More specific than "bacteria"
    'Corallina Officinalis Extract': 'marine algae',  # More specific
    'Corn Gluten Amino Acids': 'plant protein derivative',  # More specific
    'Coumarin': 'plant extract',  # More accurate than "terpenes"
    'Creatine': 'synthetic chemical',  # More accurate for commercial production
    'Cucumis Sativus Fruit Extract': 'plant extract',  # Standardized
    'Curcuma Longa Root Extract': 'plant extract',  # Standardized
    'Cyclopentasiloxane': 'synthetic silicone',  # More specific
    'Daucus Carota Sativa Root Extract': 'plant extract',  # Standardized
    'Daucus Carota Sativa Seed Oil': 'plant oil',  # Standardized
    'Decyl Glucoside': 'plant sugar derivative',  # More accurate than "fungus"
    'Dehydroacetic Acid': 'synthetic preservative',  # More accurate
    'Dextran': 'microbial fermentation',  # More accurate than "botanical"
    'Dextrin': 'plant starch derivative',  # More specific
    'Dibutyl Ethylhexanoyl Glutamide': 'synthetic chemical',  # More specific
    'Dibutyl Lauroyl Glutamide': 'synthetic chemical',  # More specific
    'Dicaprylyl Carbonate': 'synthetic ester',  # More specific
    'Dicetyl Phosphate': 'synthetic chemical',  # More specific
    'Dihydroxyacetone': 'microbial fermentation',  # More accurate
    'Diisostearyl Malate': 'synthetic ester',  # More specific
    'Dilinoleic Acid/Propanediol Copolymer': 'synthetic polymer',  # More specific
    'Dimethicone': 'synthetic silicone',  # More specific
    'Dimethicone Crosspolymer': 'synthetic silicone',  # More specific
    'Dimethicone Crosspolymer-3': 'synthetic silicone',  # More specific
    'Dimethicone/Vinyl Dimethicone Crosspolymer': 'synthetic silicone',  # More specific
    'Dimethiconol': 'synthetic silicone',  # More accurate than "fungal fermentation"
    'Dimethyl Isosorbide': 'synthetic chemical',  # More accurate
    'Dimethylmethoxy Chromanyl Palmitate': 'synthetic antioxidant',  # More specific
    'Dipotassium Glycyrrhizate': 'plant extract derivative',  # More specific
    'Dipropylene Glycol': 'synthetic chemical',  # More accurate than "glycerin"
    'Disodium Cocoamphodiacetate': 'plant oil derivative',  # More specific
    'Disodium EDTA': 'synthetic chemical',  # More accurate than "alkaloids"
    'Disodium Laureth Sulfosuccinate': 'synthetic surfactant',  # More specific
    'Disodium Nadh': 'microbial fermentation',  # More specific
    'Disodium Stearoyl Glutamate': 'synthetic surfactant',  # More accurate than "fungus"
    'Disteardimonium Hectorite': 'mineral clay derivative',  # More specific
    'Divinyldimethicone/Dimethicone Copolymer': 'synthetic silicone',  # More accurate
    'DMDM Hydantoin': 'synthetic preservative',  # Confirmed
    'Echinacea Pallida Extract': 'plant extract',  # Standardized
    'Ectoin': 'bacterial fermentation',  # More specific
    'Emu Oil': 'animal fat',  # Standardized
    'Ergothioneine': 'microbial fermentation',  # More specific
    'Erythritol': 'microbial fermentation',  # More specific
    'Erythrulose': 'microbial fermentation',  # More specific
    'Ethoxydiglycol': 'synthetic chemical',  # More accurate
    'Ethyl Olivate': 'plant oil derivative',  # More specific
    'Ethylbisiminomethylguaiacol Manganese Chloride': 'synthetic chemical',  # More specific
    'Ethylhexyl Methoxycinnamate': 'synthetic UV filter',  # More accurate than "fungus"
    'Ethylhexyl Olivate': 'plant oil derivative',  # More specific
    'Ethylhexyl Salicylate': 'synthetic UV filter',  # More accurate
    'Ethylhexylglycerin': 'synthetic chemical',  # More accurate
    'Ferulic Acid': 'plant extract',  # Standardized
    'Fomes Officinalis Extract': 'fungal extract',  # More specific
    'Fragaria Vesca Fruit Extract': 'plant extract',  # Standardized
    'Fructose': 'plant sugar',  # More specific
    'Geraniol': 'plant extract',  # More specific than "fruit"
    'Geranium Maculatum Oil': 'plant oil',  # More accurate than "rose"
    'Ginkgo Biloba Leaf Extract': 'plant extract',  # Standardized
    'Gluconolactone': 'microbial fermentation',  # More specific
    'Glucose': 'plant sugar',  # More accurate than "fungi"
    'Glycerin': 'plant oil derivative',  # More specific
    'Glyceryl Caprylate': 'plant oil derivative',  # More specific
    'Glyceryl Stearate': 'plant oil derivative',  # More specific
    'Glyceryl Stearate SE': 'plant oil derivative',  # More specific
    'Glycine': 'microbial fermentation',  # More specific
    'Glycol': 'synthetic chemical',  # More accurate
    'Glycol Distearate': 'synthetic ester',  # More specific
    'Glycol Stearate': 'synthetic ester',  # More specific
    'Glycolic Acid': 'synthetic chemical',  # More accurate for commercial production
    'Glycyrrhiza Glabra Rhizome/Root Extract': 'plant extract',  # Standardized
    'Glycyrrhiza Glabra Root Extract': 'plant extract',  # Standardized
    'Guaiazulene': 'plant extract',  # Standardized
    'Hectorite': 'mineral clay',  # More accurate than "silica"
    'Helianthus Annuus Seed Oil': 'plant oil',  # Standardized
    'Hesperidin': 'plant extract',  # More specific
    'Hexyl Cinnamal': 'synthetic fragrance compound',  # More accurate
    'Hexylene Glycol': 'synthetic chemical',  # More accurate than "fermentation"
    'Histidine': 'microbial fermentation',  # More specific
    'Homosalate': 'synthetic UV filter',  # More accurate than "mineral clay"
    'Honey': 'animal product',  # More specific
    'Honey Extract': 'animal product',  # More specific
    'Hyaluronic Acid': 'microbial fermentation',  # More accurate for commercial production
    'Hydrogenated Polyisobutene': 'petroleum derivative',  # Standardized
    'Hydrogenated Vegetable Glycerides': 'plant oil derivative',  # More specific
    'Hydrolyzed Algin': 'marine algae derivative',  # More specific
    'Hydrolyzed Caesalpinia Spinosa Gum': 'plant gum derivative',  # More specific
    'Hydrolyzed Collagen': 'animal protein derivative',  # More specific
    'Hydrolyzed Hyaluronic Acid': 'microbial fermentation derivative',  # More accurate
    'Hydrolyzed Keratin': 'animal protein derivative',  # More specific
    'Hydrolyzed Silk Protein': 'animal protein derivative',  # More specific
    'Hydrolyzed Sodium Hyaluronate': 'microbial fermentation derivative',  # More accurate
    'Hydroquinone': 'synthetic chemical',  # More accurate than "tannins"
    'Hydroxyethyl Acrylate/Sodium Acryloyldimethyl Taurate Copolymer': 'synthetic polymer',
    'Hydroxyethylcellulose': 'plant cellulose derivative',  # More specific
    'Hydroxypinacolone Retinoate': 'synthetic vitamin derivative',  # More accurate
    'Hydroxypropyl Cyclodextrin': 'plant starch derivative',  # More specific
    'Hydroxypropyltrimonium Hyaluronate': 'synthetic derivative',  # More specific
    'Ifra Certified Fragrance': 'synthetic fragrance compound',  # More accurate
    'Imperata Cylindrica Root Extract': 'plant extract',  # Standardized
    'Iron Oxides': 'mineral pigment',  # Standardized
    'Isoceteth-20': 'synthetic surfactant',  # More accurate
    'Isodecyl Neopentanoate': 'synthetic ester',  # More specific
    'Isodecyl Salicylate': 'synthetic ester',  # More specific
    'Isohexadecane': 'petroleum derivative',  # Standardized
    'Isoleucine': 'microbial fermentation',  # More specific
    'Isononyl Isononanoate': 'synthetic ester',  # More specific
    'Isosorbide Dicaprylate': 'synthetic ester',  # More specific
    'Juniperus Communis Fruit Extract': 'plant extract',  # Standardized
    'Kaolin': 'mineral clay',  # Standardized
    'Kojic Acid': 'microbial fermentation',  # More accurate
    'Lactic Acid': 'microbial fermentation',  # Standardized
    'Lactobacillus/Acerola Cherry Ferment': 'bacterial fermentation',  # More specific
    'Lactobacillus/Collagen/Mesembryanthemum Crystallinum Leaf Extract Ferment Lysate': 'bacterial fermentation',
    'Lactobacillus Ferment': 'bacterial fermentation',  # More specific
    'Lactobacillus Ferment Lysate': 'bacterial fermentation',  # More specific
    'Lactobacillus/Punica Granatum Fruit Ferment Extract': 'bacterial fermentation',  # More specific
    'Lactobacillus/Soybean Ferment Extract': 'bacterial fermentation',  # More specific
    'Lactococcus Ferment': 'bacterial fermentation',  # More specific
    'Lactococcus Ferment Lysate': 'bacterial fermentation',  # More specific
    'Laminaria Saccharina Extract': 'marine algae',  # More specific
    'Laurdimonium Hydroxypropyl Hydrolyzed Soy Protein': 'plant protein derivative',  # More specific
    'Laureth-7': 'synthetic surfactant',  # More specific
    'Laureth-9': 'synthetic surfactant',  # More specific
    'Lauric Acid': 'plant oil derivative',  # More specific
    'Lavandula Angustifolia Oil': 'plant oil',  # Standardized
    'Lecithin': 'plant oil derivative',  # More specific
    'Lens Esculenta Fruit Extract': 'plant extract',  # Standardized
    'Leuconostoc/Radish Root Ferment Filtrate': 'bacterial fermentation',  # More specific
    'Limnanthes Alba Seed Oil': 'plant oil',  # More accurate than "flaxseed"
    'Limonene': 'plant extract',  # More specific
    'Linalool': 'plant extract',  # More specific
    'Linoleamidopropyl Pg-Dimonium Chloride Phosphate': 'synthetic surfactant',  # More specific
    'Linoleic Acid': 'plant oil derivative',  # More specific
    'Linolenic Acid': 'plant oil derivative',  # More specific
    'Lonicera Caprifolium Extract': 'plant extract',  # Standardized
    'Lonicera Caprifolium Flower Extract': 'plant extract',  # Standardized
    'Lonicera Japonica Flower Extract': 'plant extract',  # Standardized
    'Luteolin': 'plant extract',  # More specific than "flower"
    'Macadamia Ternifolia Seed Oil': 'plant oil',  # More specific
    'Magnesium Aluminum Silicate': 'mineral clay',  # Standardized
    'Magnesium Chloride': 'mineral salt',  # More specific
    'Magnesium Sulfate': 'mineral salt',  # More specific
    'Maleated Soybean Oil Glyceryl/Octyldodecanol Esters': 'plant oil derivative',  # More specific
    'Malic Acid': 'synthetic chemical',  # More accurate for commercial production
    'Maltodextrin': 'plant starch derivative',  # More specific
    'Maltose': 'plant sugar derivative',  # More accurate
    'Mandelic Acid': 'synthetic chemical',  # More accurate for commercial production
    'Mannitol': 'plant sugar derivative',  # More specific
    'Maris Aqua': 'seawater',  # More accurate than "fish"
    'Melaleuca Alternifolia Leaf Oil': 'plant oil',  # Standardized
    'Melia Azadirachta Flower Extract': 'plant extract',  # Standardized
    'Melia Azadirachta Leaf Extract': 'plant extract',  # Standardized
    'Menthol': 'plant extract',  # Standardized
    'Menthone Glycerin Acetal': 'synthetic chemical',  # More accurate
    'Menthyl Lactate': 'synthetic ester',  # More accurate
    'Methoxyphenylimino Dimethylcyclohexenyl Ethyl Glycinate': 'synthetic chemical',  # More accurate
    'Methyl Methacrylate/Glycol Dimethacrylate Crosspolymer': 'synthetic polymer',  # Standardized
    'Methyl Methacrylate/PEG/PPG-4/3 Methacrylate Crosspolymer': 'synthetic polymer',  # Standardized
    'Methyl Trimethicone': 'synthetic silicone',  # More specific
    'Methylparaben': 'synthetic preservative',  # More accurate than "petroleum"
    'Mica': 'mineral',  # Standardized
    'Micrococcus Lysate': 'bacterial fermentation',  # More specific
    'Microcrystalline Wax': 'petroleum derivative',  # More accurate than "beeswax"
    'Morus Alba Root Extract': 'plant extract',  # Standardized
    'Myristoyl Nonapeptide-3': 'synthetic peptide',  # More specific
    'Myristyl Myristate': 'synthetic ester',  # More specific
    'Myrothamnus Flabellifolia Leaf/Stem Extract': 'plant extract',  # Standardized
    'Neopentyl Glycol Dicaprylate/Dicaprate': 'synthetic ester',  # More specific
    'New on INCIDecoder': 'unknown',  # This shouldn't be in the ingredient list
    'Niacinamide': 'synthetic vitamin',  # More accurate for commercial production
    'Nigella Sativa Seed Oil': 'plant oil',  # More specific
    'Nordihydroguaiaretic Acid': 'plant extract',  # Standardized
    'Ocimum Sanctum Leaf Extract': 'plant extract',  # More accurate than "turkesterone"
    'Octyldodecanol': 'synthetic fatty alcohol',  # More specific
    'Octyldodecyl Neopentanoate': 'synthetic ester',  # More specific
    'Olea Europaea Fruit Oil': 'plant oil',  # Standardized
    'Oleic Acid': 'plant oil derivative',  # More specific
    'Opuntia Ficus-Indica Extract': 'plant extract',  # Standardized
    'Opuntia Ficus-Indica Stem Extract': 'plant extract',  # Standardized
    'Oryza Sativa Extract': 'plant extract',  # Standardized
    'Palmitic Acid': 'plant oil derivative',  # More specific
    'Palmitoyl Dipeptide-5 Diaminobutyroyl Hydroxythreonine': 'synthetic peptide',  # More accurate
    'Palmitoyl Dipeptide-5 Diaminohydroxybutyrate': 'synthetic peptide',  # More specific
    'Palmitoyl Hexapeptide-12': 'synthetic peptide',  # More accurate
    'Palmitoyl Pentapeptide-4': 'synthetic peptide',  # More specific
    'Palmitoyl Tetrapeptide-7': 'synthetic peptide',  # More specific
    'Palmitoyl Tripeptide-1': 'synthetic peptide',  # More specific
    'Palmitoyl Tripeptide-38': 'synthetic peptide',  # More specific
    'Palmitoyl Tripeptide-5': 'synthetic peptide',  # More specific
    'Panax Ginseng Root Extract': 'plant extract',  # Standardized
    'Panthenol': 'synthetic vitamin',  # More accurate for commercial production
    'Parabens': 'synthetic preservative',  # More accurate than "microorganisms"
    'Paraffinum Liquidum': 'petroleum derivative',  # Standardized
    'Parfum/Fragrance': 'synthetic fragrance compound',  # More accurate
    'Pca': 'synthetic chemical',  # More accurate than "plant cell culture"
    'PEG-10 Dimethicone': 'synthetic silicone',  # More accurate
    'PEG-100 Stearate': 'synthetic surfactant',  # More specific
    'PEG-150 Distearate': 'synthetic surfactant',  # More specific
    'PEG-150 Pentaerythrityl Tetrastearate': 'synthetic surfactant',  # More specific
    'PEG-40 Hydrogenated Castor Oil': 'plant oil derivative',  # More specific
    'PEG-55 Propylene Glycol Oleate': 'synthetic surfactant',  # More specific
    'PEG/PPG-18/18 Dimethicone': 'synthetic silicone',  # More accurate than "mineral clay"
    'Pelargonium Graveolens Flower Oil': 'plant oil',  # More accurate than "grapefruit"
    'Pentaerythrityl Tetra-Di-T-Butyl Hydroxyhydrocinnamate': 'synthetic antioxidant',  # More specific
    'Pentaerythrityl Tetraethylhexanoate': 'synthetic ester',  # More specific
    'Pentylene Glycol': 'synthetic chemical',  # More accurate
    'Perilla Ocymoides Seed Extract': 'plant extract',  # Standardized
    'Persea Gratissima Oil': 'plant oil',  # More accurate than "olive oil"
    'Petrolatum': 'petroleum derivative',  # Standardized
    'Phenoxyethanol': 'synthetic preservative',  # More accurate for commercial production
    'Phenyl Trimethicone': 'synthetic silicone',  # More accurate than "fungus"
    'Phenylalanine': 'microbial fermentation',  # More accurate
    'Phospholipids': 'plant oil derivative',  # More specific
    'Phytic Acid': 'plant extract',  # Standardized
    'Phytosteryl Canola Glycerides': 'plant oil derivative',  # More specific
    'Phytosteryl Sunflowerseedate': 'plant oil derivative',  # More specific
    'Pistacia Lentiscus Gum': 'plant resin',  # More accurate than "fungus"
    'Plankton Extract': 'marine plankton',  # More specific
    'Polyacrylamide': 'synthetic polymer',  # More accurate than "fermented microorganisms"
    'Polyacrylate Crosspolymer-6': 'synthetic polymer',  # More accurate than "fungal"
    'Polybutene': 'petroleum derivative',  # Standardized
    'Polyethylene': 'petroleum derivative',  # More accurate than "fossil fuel"
    'Polyglutamic Acid': 'microbial fermentation',  # More specific
    'Polyglyceryl-10 Laurate': 'plant oil derivative',  # More specific
    'Polyglyceryl-2 Triisostearate': 'synthetic ester',  # More specific
    'Polyglyceryl-4 Oleate': 'plant oil derivative',  # More specific
    'Polyhydroxystearic Acid': 'synthetic polymer',  # More specific
    'Polymethylsilsesquioxane': 'synthetic silicone',  # More specific
    'Polypodium Vulgare Rhizome Extract': 'plant extract',  # More accurate than "mushroom"
    'Polyquaternium-10': 'synthetic polymer',  # More specific
    'Polyquaternium-22': 'synthetic polymer',  # More specific
    'Polyquaternium-7': 'synthetic polymer',  # More specific
    'Polysorbate 20': 'synthetic surfactant',  # More specific
    'Polysorbate 60': 'synthetic surfactant',  # More specific
    'Polysorbate 80': 'synthetic surfactant',  # More specific
    'Potassium Hydroxide': 'synthetic chemical',  # More accurate
    'Potassium Sorbate': 'synthetic preservative',  # More accurate
    'Potassium Sulfate': 'mineral salt',  # More accurate than "kalahari desert sand"
    'PPG-2 Hydroxyethyl Cocamide': 'plant oil derivative',  # More specific
    'PPG-26-Buteth-26': 'synthetic surfactant',  # More specific
    'PPG-3 Benzyl Ether Myristate': 'synthetic ester',  # More specific
    'PPG-3 Isostearyl Methyl Ether': 'synthetic ether',  # More specific
    'Proline': 'microbial fermentation',  # More accurate
    'Propanediol': 'microbial fermentation',  # More accurate
    'Propylene Glycol': 'synthetic chemical',  # More accurate than "glycerin"
    'Prunus Amygdalus Dulcis Oil': 'plant oil',  # Standardized
    'Prunus Amygdalus Dulcis Seed Extract': 'plant extract',  # Standardized
    'Prunus Persica Fruit Extract': 'plant extract',  # Standardized
    'Pseudoalteromonas Ferment Extract': 'bacterial fermentation',  # More specific
    'Punica Granatum Extract': 'plant extract',  # Standardized
    'Punica Granatum Seed Oil': 'plant oil',  # More specific
    'Pyrus Malus Fruit Extract': 'plant extract',  # Standardized
    'Quartz': 'mineral',  # Standardized
    'Retinol': 'synthetic vitamin',  # More accurate for commercial production
    'Retinyl Palmitate': 'synthetic vitamin derivative',  # More specific
    'Retinyl Propionate': 'synthetic vitamin derivative',  # More specific
    'Retinyl Retinoate': 'synthetic vitamin derivative',  # More specific
    'Ribes Nigrum Seed Oil': 'plant oil',  # More accurate than "blackberry"
    'Rosa Canina Fruit Oil': 'plant oil',  # Standardized
    'Rosa Canina Seed Oil': 'plant oil',  # Standardized
    'Rosa Rubiginosa Seed Oil': 'plant oil',  # More specific
    'Rose Flower Oil': 'plant oil',  # Standardized
    'Rosmarinus Officinalis Extract': 'plant extract',  # Standardized
    'Rubus Idaeus Fruit Extract': 'plant extract',  # Standardized
    'Saccharomyces Ferment': 'yeast fermentation',  # More specific
    'Saccharomyces Ferment Filtrate': 'yeast fermentation',  # More specific
    'Saccharum Officinarum Extract': 'plant extract',  # Standardized
    'Salicylic Acid': 'synthetic chemical',  # More accurate for commercial production
    'Salvia Officinalis Oil': 'plant oil',  # Standardized
    'Santalum Album Oil': 'plant oil',  # Standardized
    'Sclerocarya Birrea Seed Oil': 'plant oil',  # Standardized
    'Scutellaria Baicalensis Root Extract': 'plant extract',  # Standardized
    'Sea Whip Extract': 'marine invertebrate',  # More specific
    'Serine': 'microbial fermentation',  # More specific
    'Silica Dimethyl Silylate': 'mineral derivative',  # More specific
    'Simmondsia Chinensis Seed Oil': 'plant oil',  # Standardized
    'Sodium Acetylated Hyaluronate': 'microbial fermentation derivative',  # More accurate
    'Sodium Acrylates Copolymer': 'synthetic polymer',  # More specific
    'Sodium Acrylates Crosspolymer-2': 'synthetic polymer',  # Standardized
    'Sodium Ascorbyl Phosphate': 'synthetic vitamin derivative',  # More accurate than "sunflower"
    'Sodium Benzoate': 'synthetic preservative',  # More accurate than "fungus"
    'Sodium Chloride': 'mineral salt',  # More specific
    'Sodium Citrate': 'synthetic chemical',  # More accurate for commercial production
    'Sodium Cocoyl Glycinate': 'plant oil derivative',  # More specific
    'Sodium Cocoyl Isethionate': 'plant oil derivative',  # More specific
    'Sodium Gluconate': 'microbial fermentation',  # More accurate than "glycolysis"
    'Sodium Hyaluronate': 'microbial fermentation',  # More accurate than "skin"
    'Sodium Hyaluronate Crosspolymer': 'microbial fermentation derivative',  # More accurate
    'Sodium Hydroxide': 'synthetic chemical',  # More accurate than "botanical"
    'Sodium Lactate': 'microbial fermentation',  # More accurate than "sugar"
    'Sodium Laureth Sulfate': 'synthetic surfactant',  # More accurate than "fungus"
    'Sodium Lauroyl Sarcosinate': 'synthetic surfactant',  # More specific
    'Sodium Lauryl Sulfoacetate': 'synthetic surfactant',  # More specific
    'Sodium Methyl Cocoyl Taurate': 'plant oil derivative',  # More specific
    'Sodium PCA': 'synthetic chemical',  # More accurate
    'Sodium Polyacrylate': 'synthetic polymer',  # More accurate than "fermented yeast"
    'Sodium Rna': 'synthetic chemical',  # More accurate
    'Sodium Salicylate': 'synthetic chemical',  # More accurate
    'Sodium Stearate': 'plant oil derivative',  # More specific
    'Solanum Melongena Fruit Extract': 'plant extract',  # Standardized
    'Sorbitan Isostearate': 'synthetic surfactant',  # More specific
    'Sorbitan Laurate': 'synthetic surfactant',  # More specific
    'Sorbitan Olivate': 'plant oil derivative',  # More specific
    'Sorbitol': 'plant sugar derivative',  # More specific
    'Sphagnum Magellanicum Extract': 'plant extract',  # More accurate than "peat"
    'Squalane': 'synthetic chemical',  # More accurate for commercial production
    'Squalene': 'synthetic chemical',  # More accurate for commercial production
    'Steareth-2': 'synthetic surfactant',  # More specific
    'Steareth-20': 'synthetic surfactant',  # More specific
    'Steareth-21': 'synthetic surfactant',  # More specific
    'Stearic Acid': 'plant oil derivative',  # More specific
    'Stearyl Alcohol': 'plant fatty alcohol',  # More specific
    'Sucrose': 'plant sugar',  # More specific
    'Superoxide Dismutase': 'microbial fermentation',  # More accurate than "mushroom"
    'Synthetic Fluorphlogopite': 'synthetic mineral',  # More accurate than "fermented yeast"
    'T-Butyl Alcohol': 'synthetic chemical',  # More accurate than "fatty acids"
    'Tamarindus Indica Seed Extract': 'plant extract',  # Standardized
    'Tasmannia Lanceolata Fruit/Leaf Extract': 'plant extract',  # Standardized
    'Tetradecyl Aminobutyroylvalylaminobutyric Urea Trifluoroacetate': 'synthetic peptide',  # More specific
    'Tetrahexyldecyl Ascorbate': 'synthetic vitamin derivative',  # More specific
    'Tetrapeptide-14': 'synthetic peptide',  # More specific
    'Tetrapeptide-21': 'synthetic peptide',  # More accurate than "fungal"
    'Tetrasodium EDTA': 'synthetic chemical',  # More accurate
    'Threonine': 'microbial fermentation',  # More accurate
    'Tin Oxide': 'mineral processing',  # More specific
    'Titanium Dioxide': 'mineral processing',  # More specific
    'Tocopherol': 'plant oil derivative',  # More specific
    'Tocopheryl Acetate': 'synthetic vitamin derivative',  # More specific
    'Trehalose': 'microbial fermentation',  # More accurate for commercial production
    'Tremella Fuciformis Sporocarp Extract': 'fungal extract',  # More specific
    'Tretinoin': 'synthetic vitamin derivative',  # More accurate
    'Trideceth-12': 'synthetic surfactant',  # More accurate than "fungal"
    'Trideceth-6': 'synthetic surfactant',  # More accurate than "cosmetic origin"
    'Tridecyl Stearate': 'synthetic ester',  # More specific
    'Tridecyl Trimellitate': 'synthetic ester',  # More specific
    'Triethanolamine': 'synthetic chemical',  # More accurate
    'Triethoxycaprylylsilane': 'synthetic silicone',  # More specific
    'Triheptanoin': 'synthetic ester',  # More specific
    'Trimethylsiloxysilicate': 'synthetic silicone',  # More specific
    'Triolein': 'plant oil derivative',  # More specific
    'Trisodium Ethylenediamine Disuccinate': 'synthetic chemical',  # More accurate than "fungus"
    'Tromethamine': 'synthetic chemical',  # More accurate than "fungus"
    'Tropaeolum Majus Flower/Leaf/Stem Extract': 'plant extract',  # Standardized
    'Urea': 'synthetic chemical',  # More accurate for commercial production
    'Vaccinium Angustifolium Fruit Extract': 'plant extract',  # Standardized
    'Vaccinium Macrocarpon Fruit Extract': 'plant extract',  # Standardized
    'Vaccinium Macrocarpon Seed Oil': 'plant oil',  # More specific
    'Vaccinium Myrtillus Fruit Extract': 'plant extract',  # Standardized
    'Valine': 'microbial fermentation',  # More specific
    'Vitis Vinifera Seed Extract': 'plant extract',  # More specific
    'Vitis Vinifera Seed Oil': 'plant oil',  # More specific
    'Water': 'water',  # Simplified
    'Xanthan Gum': 'microbial fermentation',  # More accurate
    'Xylitol': 'plant sugar derivative',  # More accurate
    'Xylitylglucoside': 'plant sugar derivative',  # More specific
    'Zeolite': 'mineral',  # Standardized
    'Zinc Oxide': 'mineral processing',  # More specific
    'Zinc Pca': 'synthetic chemical'  # More accurate
}
        
        # Load CO2 emission data if provided
        self.co2_data = None
        if co2_data_path:
            self.load_co2_data(co2_data_path)
        
        # Create origin to CO2 category mapping
        self.origin_to_co2_mapping = self._create_origin_co2_mapping()
    
    def load_co2_data(self, file_path: str):
        """Load CO2 emission data from CSV file"""
        try:
            self.co2_data = pd.read_csv(file_path)
            print(f"Loaded CO2 data with {len(self.co2_data)} records")
            print(f"Available categories: {sorted(self.co2_data['Category'].unique())}")
            
        except Exception as e:
            print(f"Error loading CO2 data: {e}")
            self.co2_data = None
    
    def _create_origin_co2_mapping(self) -> Dict[str, List[str]]:
        """
        Create mapping from ingredient origins to relevant CO2 emission categories
        """
        mapping = {
            # Synthetic chemicals
            'synthetic chemical glycol': ['Chemicals & fertilisers', 'Ethylene', 'Petroleum Fuels'],
            'synthetic fragrance compound': ['Chemicals & fertilisers', 'Petroleum', 'Industries'],
            'synthetic polymer': ['Chemicals & fertilisers', 'Ethylene', 'Carbon Black'],
            'synthetic preservative': ['Chemicals & fertilisers', 'Industries'],
            
            # Plant-based origins
            'plant extract': ['Agriculture', 'Food Processing, Beverages and Tobacco', 'Transport'],
            'plant oil': ['Agriculture', 'Food Processing, Beverages and Tobacco', 'Transport'],
            'botanical extract': ['Agriculture', 'Cropland', 'Transport'],
            
            # Mineral origins
            'mineral oxide': ['Titanium Dioxide Production', 'Industries', 'Transport'],
            'zinc compound': ['Zinc Production', 'Industries', 'Transport'],
            'clay mineral': ['Ceramics', 'Industries', 'Transport'],
            
            # Fermented/Bio origins
            'fermented ingredient': ['Food Processing, Beverages and Tobacco', 'Agriculture'],
            'amino acid': ['Food Processing, Beverages and Tobacco', 'Chemicals & fertilisers'],
            
            # Petroleum derivatives
            'petroleum derivative': ['Petroleum', 'Fuel Production', 'Industries'],
            'mineral oil': ['Petroleum', 'Fuel Production', 'Transport'],
        }
        return mapping
    
    def find_closest_co2_categories(self, origin: str, threshold: float = 0.6) -> List[str]:
        """
        Find the closest matching CO2 categories for an ingredient origin using fuzzy matching
        """
        if self.co2_data is None:
            return []
        
        available_categories = self.co2_data['Category'].unique()
        
        # First try exact mapping
        if origin in self.origin_to_co2_mapping:
            # Filter to only include categories that exist in the dataset
            mapped_categories = [cat for cat in self.origin_to_co2_mapping[origin] 
                               if cat in available_categories]
            if mapped_categories:
                return mapped_categories
        
        # If no exact mapping, try fuzzy matching with category names
        matched_categories = []
        origin_words = origin.lower().split()
        
        for category in available_categories:
            category_lower = category.lower()
            
            # Check for word matches
            for word in origin_words:
                if word in category_lower or any(SequenceMatcher(None, word, cat_word).ratio() > threshold 
                                               for cat_word in category_lower.split()):
                    matched_categories.append(category)
                    break
        
        # If still no matches, use general industrial categories
        if not matched_categories:
            fallback_categories = ['Industries', 'Chemicals & fertilisers', 'Transport']
            matched_categories = [cat for cat in fallback_categories if cat in available_categories]
        
        return matched_categories
    
    def get_co2_emission_for_ingredient(self, ingredient: str, state: Optional[str] = None,
                                      aggregation: str = 'mean') -> Dict[str, Union[float, List[str], str]]:
        """
        Get CO2 emission for a specific ingredient based on its origin
        
        Returns:
            Dictionary with emission value, categories used, and origin
        """
        if ingredient not in self.ingredient_mapping:
            return {
                'emission_mt': 0.0,
                'categories': [],
                'origin': 'unknown',
                'confidence': 'low'
            }
        
        origin = self.ingredient_mapping[ingredient]
        categories = self.find_closest_co2_categories(origin)
        
        if not categories or self.co2_data is None:
            return {
                'emission_mt': 0.0,
                'categories': categories,
                'origin': origin,
                'confidence': 'low'
            }
        
        # Calculate emission based on matching categories
        total_emission = 0.0
        category_emissions = {}
        
        for category in categories:
            filtered_data = self.co2_data[self.co2_data['Category'] == category]
            
            if state:
                filtered_data = filtered_data[filtered_data['State'] == state]
            
            if not filtered_data.empty:
                if aggregation == 'sum':
                    emission = filtered_data['Emission value'].sum()
                elif aggregation == 'mean':
                    emission = filtered_data['Emission value'].mean()
                elif aggregation == 'median':
                    emission = filtered_data['Emission value'].median()
                else:
                    emission = filtered_data['Emission value'].mean()
                
                category_emissions[category] = emission
                total_emission += emission
        
        # Average across categories to avoid double-counting
        avg_emission = total_emission / len(categories) if categories else 0.0
        
        # Determine confidence based on how well we matched
        confidence = 'high' if origin in self.origin_to_co2_mapping else 'medium'
        if not category_emissions:
            confidence = 'low'
        
        return {
            'emission_mt': avg_emission,
            'categories': categories,
            'category_emissions': category_emissions,
            'origin': origin,
            'confidence': confidence,
            'total_emission_mt': total_emission
        }
    
    def analyze_ingredient_list(self, ingredients: List[str], state: Optional[str] = None) -> pd.DataFrame:
        """
        Analyze a list of ingredients and return CO2 emissions data
        """
        results = []
        
        for ingredient in ingredients:
            result = self.get_co2_emission_for_ingredient(ingredient, state)
            
            results.append({
                'ingredient': ingredient,
                'origin': result['origin'],
                'emission_mt': result['emission_mt'],
                'total_emission_mt': result.get('total_emission_mt', 0),
                'categories': ', '.join(result['categories']),
                'confidence': result['confidence'],
                'num_categories': len(result['categories'])
            })
        
        return pd.DataFrame(results)

# Example usage
if __name__ == "__main__":
    # Initialize the mapper
    mapper = IngredientCO2Mapper(co2_data_path='/Users/prishabirla/Desktop/ADT/changed_data.csv')
    
    ingredients_to_analyze = list(mapper.ingredient_mapping.keys())
    print(f"Analyzing {len(ingredients_to_analyze)} ingredients...")
    df = mapper.analyze_ingredient_list(ingredients_to_analyze)
    print("\nIngredient Analysis:")
    df.to_csv("ingredient_list.csv",index=False)
    print("ingredients added to ingredient_list.csv")