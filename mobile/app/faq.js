import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const FAQ_DATA = [
  {
    id: 1,
    question: "How do I place an order?",
    answer: "To place an order, browse our products, add items to your cart, and proceed to checkout. You'll need to create an account or log in to complete your purchase."
  },
  {
    id: 2,
    question: "What payment methods do you accept?",
    answer: "We accept various payment methods including credit/debit cards, PayPal, and cash on delivery for eligible areas."
  },
  {
    id: 3,
    question: "How long does delivery take?",
    answer: "Delivery typically takes 2-5 business days depending on your location. You'll receive a tracking number once your order is shipped."
  },
  {
    id: 4,
    question: "Can I cancel or modify my order?",
    answer: "You can cancel or modify your order within 1 hour of placing it. After that, please contact our customer support team for assistance."
  },
  {
    id: 5,
    question: "What is your return policy?",
    answer: "We offer a 30-day return policy for most items. Products must be in original condition and packaging. Perishable items cannot be returned."
  },
  {
    id: 6,
    question: "How do I track my order?",
    answer: "You can track your order by going to 'My Orders' in your account or using the tracking number sent to your email."
  },
  {
    id: 7,
    question: "Do you deliver to my area?",
    answer: "We deliver to most areas in the Philippines. Enter your address during checkout to see if delivery is available in your location."
  },
  {
    id: 8,
    question: "How do I contact customer support?",
    answer: "You can contact us through live chat, email (info@goagritrading.com), or phone. Our support team is available Monday to Friday, 8 AM to 6 PM."
  },
  {
    id: 9,
    question: "Are your products organic?",
    answer: "We offer both organic and conventional agricultural products. Look for the 'Organic' label on product listings to identify organic items."
  },
  {
    id: 10,
    question: "How do I create an account?",
    answer: "Tap 'Sign Up' on the login screen, fill in your details, and verify your email address. You can also sign up using your Google account."
  }
];

export default function FAQScreen() {
  const router = useRouter();
  const [expandedItems, setExpandedItems] = useState(new Set());

  const toggleExpanded = (id) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const renderFAQItem = (item) => {
    const isExpanded = expandedItems.has(item.id);
    
    return (
      <View key={item.id} style={styles.faqItem}>
        <TouchableOpacity
          style={styles.questionContainer}
          onPress={() => toggleExpanded(item.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.questionText}>{item.question}</Text>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color="#666"
          />
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.answerContainer}>
            <Text style={styles.answerText}>{item.answer}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Frequently Asked Questions</Text>
          <Text style={styles.headerSubtitle}>Find quick answers to common questions</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.faqContainer}>
          {FAQ_DATA.map(renderFAQItem)}
        </View>

        {/* Contact Support Section */}
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Still need help?</Text>
          <Text style={styles.contactSubtitle}>
            Can't find what you're looking for? Our support team is here to help.
          </Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => router.push('/support-chat')}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#fff" />
            <Text style={styles.contactButtonText}>Start Live Chat</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  faqContainer: {
    padding: 16,
  },
  faqItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  questionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  questionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 12,
  },
  answerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  answerText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginTop: 12,
  },
  contactSection: {
    margin: 16,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  contactSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});